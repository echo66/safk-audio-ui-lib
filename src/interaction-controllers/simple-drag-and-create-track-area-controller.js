'use strict'

import { EventEmitter } from '../utils/event-emitter.js';
import { getRelativeCoordinates } from '../utils/mouse-helpers.js';

class SimpleDragAndCreateTrackAreaController extends EventEmitter {

	constructor(params) {
		super();
		const that = this;
		this._ = {};
		this._.track = params.track;
		this._.disappearOnRelease = (params.disappearOnRelease !== undefined)? 
															params.disappearOnRelease 
															: true;

		this._.started = false;
		this._.manualControl = params.manualControl || false;
		
		this._.areaData = {
			x: 0, 
			y: 0, 
			width: 0, 
			height: 0, 
			color: "yellow", 
			opacity: 1
		};

		this._.$container = document.createElement('div');
		this._.$selectionArea = document.createElement('div');


		this._on_mousedown = (e) => {
			if (this.started) {
				e.preventDefault();

				this._.track.layersDomEl.style.pointerEvents = "none";

				if (!this._.manualControl) {
					that._.$container.addEventListener('mousemove', that._on_mousemove);
					that._.$container.addEventListener('mouseup', that._on_mouseup);
					that._.$container.removeEventListener('mousedown', that._on_mousedown);
				}

				// var pos = mousePositionElement(e);
				// var pos = { x: e.clientX, y: e.clientY };
				var pos = getRelativeCoordinates(e, that._.$container);

				that._.$container.style.width = that._.track.interactionsDomEl.style.width;
				that._.$container.style.height = that._.track.interactionsDomEl.style.height;
				that._.$container.appendChild(that._.$selectionArea);
				// that._.track.interactionsDomEl.appendChild(that._.$container);

				that._.areaData.x = that._.firstCoords.x = pos.x;
				that._.areaData.y = that._.firstCoords.y = pos.y;
				that._.areaData.width = 0;
				that._.areaData.height = 0;

				// this.emit('drag-start', that._.areaData);

				this.on_drag_start(that._.areaData, e);

				that._draw_area();
			}
		};

		this._on_mousemove = (e) => {
			if (this.started) {
				e.preventDefault();

				// var pos = mousePositionElement(e);
				// var pos = { x: e.clientX, y: e.clientY };
				var pos = getRelativeCoordinates(e, that._.$container);
				// console.log(pos);

				var a = that._.areaData;

				a.x = Math.min(that._.firstCoords.x, pos.x);
				a.y = Math.min(that._.firstCoords.y, pos.y);
				a.width = Math.abs(that._.firstCoords.x - pos.x);
				a.height = Math.abs(that._.firstCoords.y - pos.y);

				// this.emit('drag', that._.areaData);

				this.on_drag(that._.areaData, e);

				that._draw_area();
			}
		};

		this._on_mouseup = (e) => {
			if (this.started) {
				e.preventDefault();

				this._.track.layersDomEl.style.pointerEvents = "all";

				// var pos = mousePositionElement(e);
				// var pos = { x: e.clientX, y: e.clientY };
				var pos = getRelativeCoordinates(e, that._.$container);

				if (!this._.manualControl) {
					that._.$container.addEventListener('mousedown', that._on_mousedown);
					that._.$container.removeEventListener('mousemove', that._on_mousemove);
					that._.$container.removeEventListener('mouseup', that._on_mouseup);
				}

				this.on_drag_end(that._.areaData, e);

				if (this._.disappearOnRelease) {
					that._.areaData.x = 0;
					that._.areaData.y = 0;
					that._.areaData.width = 0;
					that._.areaData.height = 0;
				}

				that._draw_area();

				// this.emit('drag-end', that._.areaData);

				// that._.$selectionArea.remove();
				// that._.$container.remove();
			}
		};
	}

	on_drag_start(area, e) {
		throw new Error('not implemented');
	}

	on_drag(area, e) {
		throw new Error('not implemented');
	}

	on_drag_end(area, e) {
		throw new Error('not implemented');
	}

	handle_event(e) {
		if (this.started) {
			switch (e.type) {
				case 'mousedown': 
					this._on_mousedown(e);
					break;
				case 'mousemove': 
					this._on_mousemove(e);
					break;
				case 'mouseup': 
					this._on_mouseup(e);
					break;
			}
		}
	}

	start() {
		if (!this._.started) {
			this._.started = true;
			this._.lastEventType = undefined;
			this._.firstCoords = { x: undefined, y: undefined };

			this._.$container.style.width = this._.track.interactionsDomEl.style.width;
			this._.$container.style.height = this._.track.interactionsDomEl.style.height;
			this._.$container.appendChild(this._.$selectionArea);

			this._.track.interactionsDomEl.appendChild(this._.$container);

			this._.track.interactionsDomEl.style.pointerEvents = "auto";

			if (!this._.manualControl) {
				this._.$container.addEventListener('mousedown', this._on_mousedown);
				// this._.$container.addEventListener('click', this._on_click);
			}
		}
	}

	stop() {
		if (this._.started) {
			this._.started = false;
			this._.lastEventType = undefined;
			this._.firstCoords = { x: undefined, y: undefined };

			this._.$selectionArea.remove()
			this._.$container.remove();

			this._.track.interactionsDomEl.style.pointerEvents = "none";

			if (!this._.manualControl) {
				this._.$container.removeEventListener('mousedown', this._on_mousedown);
				this._.$container.removeEventListener('mousemove', this._on_mousemove);
				this._.$container.removeEventListener('mouseup', this._on_mouseup);
				// this._.$container.removeEventListener('click', this._on_click);
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
										"background-color: " + a.color + "; " + 
										"opacity: " + a.opacity + "; " + 
										"position: relative; ";
	}

	clear_area() {
		this._.areaData.x = 0;
		this._.areaData.y = 0;
		this._.areaData.width = 0;
		this._.areaData.height = 0;

		this._draw_area();
	}

	get started() {
		return this._.started;
	}

	get disappearOnRelease() {
		return this._.disappearOnRelease;
	}

	set disappearOnRelease(v) {
		this._.disappearOnRelease = v;
	}

	get track() {
		return this._.track;
	}


}

export { SimpleDragAndCreateTrackAreaController };