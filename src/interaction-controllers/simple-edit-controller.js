'use strict'

import { EventEmitter } from '../utils/event-emitter.js';
// import { List } from '../utils/list.js';
import { SelectionManager } from '../helpers/selection-manager.js';

class SimpleEditController extends EventEmitter {
	
	constructor(params) {
		super();
		const that = this;
		this._ = {};
		this._.layer = params.layer;
		this._.selectionManager = params.selectionManager || new SelectionManager();
		this._.accessors = params.accessors || {
			time: (d, v) => {
				if (!isNaN(v)) 
					d.time = v;
				return d.time;
			}
		};
		this._.started = false;
		this._.manualControl = params.manualControl || false;

		this._.toBeUpdated = new Set();
		// this._.beingSelected = new List();
		// this._.beingUnselected = new List();
		this._.updateIterator = {
			start: function(layer) {
				this.entry = this.entry || {};
				this.entry.value = undefined; 
				this.entry.done = false;
				this.toBeUpdatedIt = that._.toBeUpdated.values();
			}, 
			next: function() {
				// let next = that._.beingSelected.pop() || that._.beingUnselected.pop();
				// this.entry.value = next;
				// this.entry.done = (next)? false : true;
				this.entry = this.toBeUpdatedIt.next();
				return this.entry;
			}, 
			stop: function() {
				this.entry.value = undefined; 
				this.entry.done = false;
				this.toBeUpdatedIt = undefined;
			}
		};

		this._.on_mousedown = (e) => {
			if (this.started) {
				e.preventDefault();

				if (!this._.manualControl) {
					this._.layer.layerDomEl.addEventListener('mousemove', this._.on_mousemove);
					this._.layer.layerDomEl.addEventListener('mouseup', this._.on_mouseup);
				}

				this._.lastEventType = e.type;
				this._.lastCoords.x = e.clientX;
				this._.lastCoords.y = e.clientY;
				this._.startingEl = e.target;

				// this._.selection_check(e);
			}
		};

		this._.on_mousemove = (e) => {
			if (this.started) {
				e.preventDefault();

				if (!this._.manualControl) {
					this._.layer.layerDomEl.removeEventListener('mousedown', this._.on_mousedown);
				}

				const that = this;

				let lastEventType = this._.lastEventType;

				if (lastEventType === 'mousedown') {
					this.emit('start-edit-layer', that._.layer);
					this._.selectionManager.apply_on_selected(this._.layer, (datum) => {
						this.emit('start-edit-datum', that._.layer, datum);
					});
				}

				this._.lastEventType = e.type;

				this._.selectionManager.apply_on_selected(this._.layer, (datum) => {
					let dx = e.clientX - this._.lastCoords.x;
					let dy = e.clientY - this._.lastCoords.y;
					this._edit_datum(datum, that._.startingEl, e, dx, dy);
					// this._.beingSelected.push(datum);
					this._.toBeUpdated.add(datum);
					this.emit('edit-datum', that._.layer, datum, dx, dy);
				}, () => {
					this._.layer.update(this._.updateIterator);
					this._.toBeUpdated.clear();
				});

				this._.lastCoords.x = e.clientX;
				this._.lastCoords.y = e.clientY;

				this.emit('edit-layer', that._.layer);
			}
		};

		this._.on_mouseup = (e) => {
			if (this.started) {
				e.preventDefault();

				if (this._.lastEventType === 'mousedown') {
					this._.selection_check(e);
				}

				if (!this._.manualControl) {
					this._.layer.layerDomEl.removeEventListener('mousemove', this._.on_mousemove);
					this._.layer.layerDomEl.removeEventListener('mouseup', this._.on_mouseup);
					this._.layer.layerDomEl.addEventListener('mousedown', this._.on_mousedown);
				}

				let lastEventType = this._.lastEventType;

				this._.startingEl = undefined;
				this._.lastCoords.x = e.clientX;
				this._.lastCoords.y = e.clientY;
				this._.lastEventType = e.type;

				if (lastEventType === 'mousemove') {
					const that = this;
					this._.selectionManager.apply_on_selected(this._.layer, (datum) => {
						this.emit('end-edit-datum', that._.layer, datum);
					});
					this.emit('end-edit-layer', that._.layer);
				}
			}
		}

		this._.selection_check = (e) => {
			let update = false;
			if (!e.shiftKey) {
				this._.selectionManager.unselect_all(this._.layer, (datum) => { 
					// this._.beingUnselected.push(datum); 
					this._.toBeUpdated.add(datum);
				});
				update = true;
			} 
			var datum, 
				layerTagName = this._.layer.layerDomEl.tagName;

			var hash = null;
			var $el = e.target;
			while (hash === null && $el.tagName !== layerTagName) {
				hash = $el.getAttribute(this._.layer._.layerElementDatumHashAttribute);
				$el = $el.parentElement;
			}

			if (hash !== undefined) 
				datum = this._.layer.get_datum(hash);

			if (datum) {
				if (this._.selectionManager.is_selected(this._.layer, datum)) {
					this._.selectionManager.unselect(this._.layer, datum, (datum) => { 
						// this._.beingUnselected.push(datum); 
						this._.toBeUpdated.add(datum);
					});
				} else {
					this._.selectionManager.select(this._.layer, datum, (datum) => { 
						// this._.beingSelected.push(datum); 
						this._.toBeUpdated.add(datum);
					});
				}
				update = true;
			}

			if (update) {
				this._.layer.update(this._.updateIterator);
				this._.toBeUpdated.clear();
			}
		}
	}

	handle_event(e) {
		if (this.started) {
			switch (e.type) {
				case 'mousedown': 
					this._.on_mousedown(e);
					break;
				case 'mousemove': 
					this._.on_mousemove(e);
					break;
				case 'mouseup': 
					this._.on_mouseup(e);
					break;
			}
		}
	}

	start() {
		if (!this.started) {
			this._.started = true;
			this._.lastEventType = undefined;
			this._.lastCoords = { x: undefined, y: undefined };
			if (!this._.manualControl) {
				this._.layer.layerDomEl.addEventListener('mousedown', this._.on_mousedown);
				// this._.layer.layerDomEl.addEventListener('click', this._on_click);
			}
		}
	}

	stop() {
		if (this.started) {
			if (!this._.manualControl) {
				this._.layer.layerDomEl.removeEventListener('mousedown', this._.on_mousedown);
				this._.layer.layerDomEl.removeEventListener('mousemove', this._.on_mousemove);
				this._.layer.layerDomEl.removeEventListener('mouseup', this._.on_mouseup);
				// this._.layer.layerDomEl.removeEventListener('click', this._on_click);
			}
			this._.started = false;
			this._.lastEventType = undefined;
			this._.lastCoords = { x: undefined, y: undefined };
			this._.startingEl = undefined;
			this._.updateIterator.stop();
			// this._.beingSelected.clear();
			// this._.beingUnselected.clear();
			this._.toBeUpdated.clear();
		}
	}

	_generate_datum_value(datum, accessorName, delta, scale) {
		let oldValue = this._.accessors[accessorName](datum);
		let oldCoord = scale(oldValue);
		let newCoord = oldCoord + delta;
		let newValue = scale.invert(newCoord);

		return newValue;
	}

	_edit_datum(datum, startingEl, e, dx, dy) {
		let newStartTime = this._generate_datum_value(datum, 'time', dx, this._.layer._.timeToPixel);
		(!isNaN(newStartTime)) && this._.accessors.time(datum, newStartTime);
	}

	is_editing(layer, datum) {
		if (this._.lastEventType === 'mousemove') {
			return this.selectionManager.is_selected(layer, datum);
		}
		return false;
	}

	get selectionManager() {
		return this._.selectionManager;
	}

	get started() {
		return this._.started;
	}
}

export { SimpleEditController };