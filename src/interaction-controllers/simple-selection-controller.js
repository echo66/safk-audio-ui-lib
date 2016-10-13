'use strict'

import { EventEmitter } from '../utils/event-emitter.js';
import { SelectionManager } from '../helpers/selection-manager.js';

class SimpleSelectionController extends EventEmitter {

	constructor(params) {
		super();
		const that = this;
		this._ = {};
		this._.$parent = params.$parent;
		this._.$eventsSource = params.$eventsSource;
		this._.targetLayers = new Map();
		this._.selectionManager = params.selectionManager || new SelectionManager();
		/*
			TODO:
				at the end of the selection area drag, one might want to keep the area visible.
		 */
		this._.disappearOnRelease = (params.disappearOnRelease !== undefined)? 
															params.disappearOnRelease 
															: true;

		this._.started = false;
		this._.manualControl = params.manualControl || false;
		/*
			TODO:
				allow selection area value snap (e.g.: this could be 
				used to snap the area to a beat grid)
		 */
		
		this._.areaData = {
			x: 0, 
			y: 0, 
			width: 0, 
			height: 0, 
			color: 'yellow', 
			opacity: 1
		};

		this._.$container = document.createElement('div');
		this._.$selectionArea = document.createElement('div');


		this._on_mousedown = (e) => {
			if (this.started) {
				e.preventDefault();

				if (!this._.manualControl) {
					that._.$eventsSource.addEventListener('mousemove', that._on_drag);
					that._.$eventsSource.addEventListener('mouseup', that._on_dragend);
					that._.$eventsSource.removeEventListener('mousedown', that._on_mousedown);
				}

				if (!e.shiftKey) {
					// TODO: update in a more intelligent manner.
					var it1 = that._.targetLayers.entries();
					var entry = it1.next();
					while (!entry.done) {
						var layer = entry.value[0];
						that._.selectionManager.unselect_all(layer);
						layer.update();
						entry = it1.next();
					}
				}

				that._.$container.style.width = that._.$parent.style.width;
				that._.$container.style.height = that._.$parent.style.height;
				that._.$container.appendChild(that._.$selectionArea);
				that._.$parent.appendChild(that._.$container);

				that._.areaData.x = that._.firstCoords.x = e.offsetX;
				that._.areaData.y = that._.firstCoords.y = e.offsetY;
				that._.areaData.width = 0;
				that._.areaData.height = 0;

				that._draw_area();
			}
		};

		this._on_drag = (e) => {
			if (this.started) {
				e.preventDefault();

				var a = that._.areaData;

				a.x = Math.min(that._.firstCoords.x, e.offsetX);
				a.y = Math.min(that._.firstCoords.y, e.offsetY);
				a.width = Math.abs(that._.firstCoords.x - e.offsetX);
				a.height = Math.abs(that._.firstCoords.y - e.offsetY);

				that._draw_area();

				var it1 = that._.targetLayers.entries();
				var entry1 = it1.next();
				while (!entry1.done) {
					var layer = entry1.value[0];
					var in_area_fn = entry1.value[1];
					var it2 = in_area_fn(layer, a.x, a.y, a.width, a.height);
					if (!it2) 
						continue;
					var entry2 = it2.next();
					while (!entry2.done) {
						var datum = entry2.value;
						// if (e.shiftKey) {
						// 	/*
						// 		TODO:
						// 			this causes a flickering behavior in the UI due to the 
						// 			constant select/unselect. I need to have a list of what 
						// 			was selected/unselected since the mousedown event 
						// 			was emitted.
						// 	 */
						// 	if (that._.selectionManager.is_selected(layer, datum)) {
						// 		that._.selectionManager.unselect(layer, datum);
						// 	} else { 
						// 		that._.selectionManager.select(layer, datum);
						// 	}
						// } else {
						// 	that._.selectionManager.select(layer, datum);
						// }
						that._.selectionManager.select(layer, datum);
						entry2 = it2.next();
					}
					layer.update(); // TODO: update in a more intelligent manner.
					entry1 = it1.next();
				}
			}
		};

		this._on_dragend = (e) => {
			if (this.started) {
				e.preventDefault();

				if (!this._.manualControl) {
					that._.$eventsSource.addEventListener('mousedown', that._on_mousedown);
					that._.$eventsSource.removeEventListener('mousemove', that._on_drag);
					that._.$eventsSource.removeEventListener('mouseup', that._on_dragend);
				}

				that._.$selectionArea.remove();
				that._.$container.remove();
				that._.areaData.x = 0;
				that._.areaData.y = 0;
				that._.areaData.width = 0;
				that._.areaData.height = 0;
			}
		};
		
		this._on_click = (e) => {
			if (!e.shiftKey) {
				// TODO
			} else {
				// TODO
			}
		};
	}

	handle_event(e) {
		if (this.started) {
			switch (e.type) {
				case 'mousedown': 
					this._on_mousedown(e);
					break;
				case 'mousemove': 
					this._on_drag(e);
					break;
				case 'mouseup': 
					this._on_dragend(e);
					break;
			}
		}
	}

	start() {
		if (!this._.started) {
			this._.started = true;
			this._.lastEventType = undefined;
			this._.firstCoords = { x: undefined, y: undefined };

			if (!this._.manualControl) {
				this._.$eventsSource.addEventListener('mousedown', this._on_mousedown);
				// this._.$eventsSource.addEventListener('click', this._on_click);
			}
		}
	}

	stop() {
		if (this._.started) {
			this._.started = false;
			this._.lastEventType = undefined;
			this._.firstCoords = { x: undefined, y: undefined };
			if (!this._.manualControl) {
				this._.$eventsSource.removeEventListener('mousedown', this._on_mousedown);
				this._.$eventsSource.removeEventListener('mousemove', this._on_drag);
				this._.$eventsSource.removeEventListener('mouseup', this._on_dragend);
				// this._.$eventsSource.removeEventListener('click', this._on_click);
			}
		}
	}

	_draw_area() {
		var a = this._.areaData;
		this._.$selectionArea.style = 
										"top: " + a.y + "px; " +
										"left: " + a.x + "px; " + 
										"width: " + a.width + "px; " + 
										"height: " + a.height + "px; " + 
										"background-color: yellow; " + 
										"position: relative; ";
	}

	/*
		in_area_fn(layer, x, y, width, height) -> Iterator
	 */
	add(layer, in_area_fn) {
		this._.targetLayers.set(layer, in_area_fn);
	}

	remove(layer) {
		this._.targetLayers.delete(layer);
	}

	get started() {
		return this._.started;
	}
}

export { SimpleSelectionController };