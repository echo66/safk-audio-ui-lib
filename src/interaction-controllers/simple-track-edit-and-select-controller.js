'use strict'

import { EventEmitter } from '../utils/event-emitter.js';
import { SelectionManager } from '../helpers/selection-manager.js';
// import { SimpleEditController } from './simple-edit-controller.js';
import { SimpleSelectionController } from './simple-selection-controller.js';

class SimpleTrackEditAndSelectController extends EventEmitter {
	constructor(params) {
		super();

		const that = this;
		this._ = {};
		this._.selectionManager = params.selectionManager || new SelectionManager();
		this._.track = params.track; 
		this._.selectionController = new SimpleSelectionController({
			$eventsSource: this._.track.trackDomEl, 
			$parent: this._.track.interactionsDomEl, 
			selectionManager: that._.selectionManager, 
			manualControl: true
		});
		this._.editControllers = new Map();
		this._.accessors  = params.accessors;

		this._.create_edit_controller = (layer) => {
			var EditController = that.get_edit_controller_class(layer);
			var editController = new EditController({
				layer: layer, 
				allowXEdit: that.get_allow_x_edit(layer), 
				allowYEdit: that.get_allow_y_edit(layer), 
				selectionManager: that._.selectionManager, 
				manualControl: true, 
				accessors: that.get_edit_controller_accessors(layer)
			});
			editController.on('start-edit-layer', (layer, datum) => that.emit('start-edit-layer', layer));
			editController.on('start-edit-datum', (layer, datum) => that.emit('start-edit-datum', layer, datum));
			editController.on('edit-layer', (layer) => that.emit('edit-layer', layer));
			editController.on('edit-datum', (layer, datum) => that.emit('edit-datum', layer, datum));
			editController.on('end-edit-layer', (layer) => that.emit('end-edit-layer', layer));
			editController.on('end-edit-datum', (layer, datum) => that.emit('end-edit-datum', layer, datum));

			return editController;
		};

		this._.add_layer = (layer) => {
			var editController = that._.create_edit_controller(layer);

			if (that.started) 
				editController.start();

			that._.editControllers.set(layer, editController);

			that._.selectionController.add(layer, that._.get_in_area_fn(layer));
		};

		this._.remove_layer = (layer) => {
			editController = that._.editControllers.get(layer);
			editController.stop();
			that._.editControllers.delete(layer);

			that._.selectionController.remove(layer);
		};

		this._.track.on('added-layer', this._.add_layer);
		this._.track.on('removed-layer', this._.remove_layer);

		var it = this._.track.layers;
		var entry = it.next();
		while (!entry.done) {
			var layer = entry.value;
			this._.add_layer(layer);
		}


		var process = undefined;

		var f = (e) => {
			if (process === 'edit') {
				editController.start();
				editController.handle_event(e);
			} else if (process === 'select') {
				selectionController.start();
				selectionController.handle_event(e);
			}
		};

		this._.mousedown = (e) => {
			var hash = null;
			var $el = e.target;

			while (hash === null && $el !== that._.track.layersDomEl) {
				hash = $el.getAttribute('data-hash');
				if (hash) 
					break;
				$el = $el.parentElement;
			}

			process = (hash !== null)? 'edit' : 'select';

			f(e);
			this._.track.trackDomEl.removeEventListener('mousedown', this._.mousedown);
			this._.track.trackDomEl.addEventListener('mousemove', this._.mousemove);
			this._.track.trackDomEl.addEventListener('mouseup', this._.mouseup);
		};

		this._.mousemove = (e) => {
			f(e);
		};

		this._.mouseup = (e) => {
			f(e);
			this._.track.trackDomEl.addEventListener('mousedown', this._.mousedown);
			this._.track.trackDomEl.removeEventListener('mousemove', this._.mousemove);
			this._.track.trackDomEl.removeEventListener('mouseup', this._.mouseup);
		};

		this._.track.trackDomEl.addEventListener('mousedown', this._.mousedown);
	}

	start() {
		if (!this.started) {
			this._.started = true;
			this._.selectionController.start();
			this._.editControllers.forEach((layer, editController) => editController.start());
		}
	}

	stop() {
		if (this.started) {
			this._.started = false;
			this._.selectionController.stop();
			this._.editControllers.forEach((layer, editController) => editController.stop());
		}
	}

	is_editing(layer, datum) {
		return this._.editController.is_editing(layer, datum);
	}

	get_in_area_fn(layer) {
		throw new Error('not implemented');
	}

	get_edit_controller_class(layer) {
		throw new Error('not implemented');
	}

	get_edit_controller_accessors(layer) {
		throw new Error('not implemented');
	};

	get_allow_x_edit(layer) {
		throw new Error('not implemented');
	}

	get_allow_y_edit(layer) {
		throw new Error('not implemented');
	}

	get selectionManager() {
		return this._.selectionManager;
	}

	get started() {
		return this._.started;
	}

	get_layer_edit_controller(layer) {
		return this._.editControllers.get(layer);
	}
}

export { SimpleTrackEditAndSelectController }