'use strict'

class TimeScroller {
	constructor(params) {
		const that = this;
		this._ = {};
		params = params || {};
		this._.scrollerLayer = new SegmentsLayer(params);
		this._.scrollerLayer.accessor('visible', (d, elementName) => {
			switch (elementName) {
				case 'top-handler': 
				case 'bottom-handler': 
					return false;
				default:
					return true;
			}
		});
		this._.scrollerLayer.timeDomain = params.availableTimeRange || this._.scrollerLayer.timeDomain;
		this._.scrollerSegment = {
			time: 0, 
			duration: 20
		};
		if (params.visibleTimeRange) {
			this._.scrollerSegment.time = params.visibleTimeRange[0];
			this._.scrollerSegment.duration = params.visibleTimeRange[1] - params.visibleTimeRange[0];
		}
		this._.scrollerLayer.get_datum = (hash) => {
			if (hash === "scroll-segment")
				return that._.scrollerSegment;
		};

		this._.scrollerLayer.get_hash = (datum) => {
			return "scroll-segment";
		};
		this._.targetLayers = new Set();
		this._.scrollerLayer.set(this._.scrollerSegment);
		this.refresh();



		this._.selectedData = new Set();
		this._.lastEventType = undefined;
		this._.lastCoords = { x: undefined, y: undefined };
		this._.elementTouched = undefined;

		this._.mousedown = (e) => {
			that._.lastEventType = e.type;
			that._.lastCoords.x = e.clientX;
			that._.lastCoords.y = e.clientY;

			var tagName = e.target.tagName.toLowerCase();
			if (tagName === 'handler') {
				if (e.target.hasAttribute('left-handler')) {
					this._.elementTouched = 'left-handler';
				} else if (e.target.hasAttribute('right-handler')) {
					this._.elementTouched = 'right-handler';
				}
			} else if (tagName === 'background') 
				this._.elementTouched = 'background';

			that._.scrollerLayer.layerDomEl.addEventListener('mousemove', that._.drag);
			that._.scrollerLayer.layerDomEl.addEventListener('mouseup', that._.dragend);
		};

		this._.drag = (e) => {
			that._.lastEventType = e.type;

			that._.scrollerLayer.layerDomEl.removeEventListener('mousedown', that._.mousedown);

			let dx = e.clientX - that._.lastCoords.x;
			let px = 0;
			switch (that._.elementTouched) {
				case 'background': 
					px = that._.scrollerLayer._.timeToPixel(that._.scrollerSegment.time);
					that._.scrollerSegment.time = that._.scrollerLayer._.timeToPixel.invert(px + dx);
					break;
				case 'left-handler': 
					let oldEnd = that._.scrollerSegment.time + that._.scrollerSegment.duration;
					px = that._.scrollerLayer._.timeToPixel(that._.scrollerSegment.time);
					let newStart = that._.scrollerLayer._.timeToPixel.invert(px + dx);
					if (newStart < oldEnd) {
						that._.scrollerSegment.time = newStart;
						that._.scrollerSegment.duration = oldEnd - newStart;
					}
					break;
				case 'right-handler': 
					px = that._.scrollerLayer._.timeToPixel(that._.scrollerSegment.time + that._.scrollerSegment.duration);
					let newDuration = that._.scrollerLayer._.timeToPixel.invert(px + dx) - that._.scrollerSegment.time;
					if (newDuration > 0)
						that._.scrollerSegment.duration = newDuration;
					break;
			}
			that._.scrollerLayer.set(that._.scrollerSegment);
			that.refresh();

			that._.lastCoords.x = e.clientX;
			that._.lastCoords.y = e.clientY;
		};

		this._.dragend = (e) => {
			that._.lastCoords.x = e.clientX;
			that._.lastCoords.y = e.clientY;
			that._.scrollerLayer.layerDomEl.removeEventListener('mousemove', that._.drag);
			that._.scrollerLayer.layerDomEl.removeEventListener('mouseup', that._.dragend);
			that._.lastEventType = e.type;
			that._.elementTouched = undefined;

			that._.scrollerLayer.layerDomEl.addEventListener('mousedown', that._.mousedown);
		};

		this._.selectioncheck = (e) => {
			if (!e.shiftKey) {
				that._.selectedData.clear();
			} 
			var datum, 
				tagName = e.target.tagName.toLowerCase();

			if (tagName === 'segment') {
				datum = e.target.datum;
			} else {
				datum = e.target.parentElement.datum;
			}

			if (datum) {
				that._.selectedData.add(datum);
			}

			that._.scrollerLayer.update();
		};

		this._.scrollerLayer.layerDomEl.addEventListener('mousedown', this._.mousedown);
	}

	get visibleTimeRange() {
		return [this._.scrollerSegment.time, this._.scrollerSegment.time + this._.scrollerSegment.duration];
	}

	set visibleTimeRange(v) {
		if (isNaN(v[0]) || isNaN(v[1]) || v[0] >= v[1])
			return;
		this._.scrollerSegment.time = v[0];
		this._.scrollerSegment.duration = v[1] - v[0];
		this._.scrollerLayer.set(this._.scrollerSegment);
		this.refresh();
	}

	get availableTimeRange() {
		return this._.scrollerLayer.timeDomain;
	}

	set availableTimeRange(v) {
		if (isNaN(v[0]) || isNaN(v[1]) || v[0] >= v[1])
			return;
		this._.scrollerLayer.timeDomain = v;
	}

	get layerDomEl() {
		return this._.scrollerLayer.layerDomEl;
	}

	add_target_layer(layer) {
		this._.targetLayers.add(layer);
	}

	remove_target_layer(layer) {
		this._.targetLayers.delete(layer);
	}

	refresh() {
		const that = this;
		this._.targetLayers.forEach((layer) => {
			layer.timeDomain = that.visibleTimeRange;
		});
	}

}