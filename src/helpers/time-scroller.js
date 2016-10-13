'use strict'

import { EventEmitter } from '../utils/event-emitter.js';
import { SegmentsLayer } from '../layers/segments-layer.js';
import { SimpleSegmentEditController } from '../interaction-controllers/simple-segment-edit-controller.js';

class TimeScroller extends EventEmitter {
	constructor(params) {
		super();

		const that = this;
		this._ = {};
		params = params || {};
		
		this._.restrictToAvailableTimeRange = (params.restrictToAvailableTimeRange !== undefined)? params.restrictToAvailableTimeRange : false;
		this._.lockVisibleTimeRange = () => {
			var newTime = Math.max(that._.scrollerSegment.time, that._.scrollerLayer.timeDomain[0])
			var end1 = (that._.scrollerLayer.timeDomain[0] + that._.scrollerLayer.timeDomain[1]);
			var end2 = (newTime + that._.scrollerSegment.duration);
			if (end2 > end1) {
				that._.scrollerSegment.time = Math.max(end1 - that._.scrollerSegment.duration, that._.scrollerLayer.timeDomain[0]);
			} else {
				that._.scrollerSegment.time = newTime;
			}
		};

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

		this._.scrollerLayer.get_hash = (datum) => "scroll-segment";
		this._.targets = new Set();
		this._.scrollerLayer.set(this._.scrollerSegment);
		

		var editController = new SimpleSegmentEditController({ 
			layer: this._.scrollerLayer, 
			allowXEdit: true, 
			allowYEdit: false, 
			accessors: {
				time: (d, v) => {
					if (!isNaN(v)) {
						d.time = v;
						if (that._.restrictToAvailableTimeRange) 
							that._.lockVisibleTimeRange();
					}
					return d.time;
				}, 
				duration: (d, v) => {
					if (!isNaN(v)) {
						d.duration = v;
						if (that._.restrictToAvailableTimeRange) 
							that._.lockVisibleTimeRange();
					}
					return d.duration;
				}
			}, 
			manualControl: false
		});
		editController.start();

		editController.on('start-edit-layer', () => { 
			that.emit('start-scrolling'); 
		});

		editController.on('edit-layer', () => {
			that.refresh();
			that.emit('scrolling');
		});

		editController.on('end-edit-layer', () => { 
			that.emit('end-scrolling'); 
		});

		this.refresh();
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

	get restrictToAvailableTimeRange() {
		return this._.restrictToAvailableTimeRange;
	}

	set restrictToAvailableTimeRange(v) {
		this._.restrictToAvailableTimeRange = v;
	}

	add(target) {
		const that = this;
		this._.targets.add(target);
		requestAnimationFrame(() => {
			target.timeDomain = that.visibleTimeRange;
		});
	}

	remove(target) {
		this._.targets.delete(target);
	}

	refresh() {
		const that = this;
		this._.targets.forEach((target) => {
			requestAnimationFrame(() => {
				target.timeDomain = that.visibleTimeRange;
			});
		});
	}

}

export { TimeScroller };