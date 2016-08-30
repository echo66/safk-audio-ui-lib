'use strict'

class TimeScroller extends EventEmitter {
	constructor(params) {
		super();

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
		

		var editController = new SimpleSegmentEditController({ 
			layer: this._.scrollerLayer, allowXEdit: true, allowYEdit: false
		});

		editController.on('start-edit', () => { 
			that.emit('start-scrolling'); 
		});

		editController.on('edit', () => {
			that.refresh();
			that.emit('scrolling');
		});

		editController.on('start-edit', () => { 
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