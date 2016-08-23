'use strict'

class MarkersLayer {
	
	constructor(params) {
		this._ = {};
		params = params || {};

		this._.timeToPixel = linear();
		this._.valueToPixel = linear();

		let layerHeight = (params.height !== undefined)? params.height : 100;
		let layerWidth = (params.width !== undefined)? params.width : 500;

		this._.timeDomain = params.timeDomain || [0, 20];
		this._.valueDomain = params.valueDomain || [0, 1];

		this._.timeToPixel.domain(this._.timeDomain).range([0, layerWidth]);
		this._.valueToPixel.domain(this._.valueDomain).range([0, layerHeight]);

		this._.$el = document.createElement('layer');
		// this._.$el.style.position = "absolute";
		this._.$el.style.overflow = "hidden";
		this._.$el.style.height = layerHeight + "px";
		this._.$el.style.width = layerWidth + "px";

		// params.parent.appendChild(this._.$el);

		this._.datumHashToDOM = new Map();

		this._.accessors = {};

		this._.accessors = {
			time: (d) => {
				return d.time;
			}, 
			color: (d, elementName) => {
				switch (elementName) {
					case 'stick': 
						return (d.color !== undefined)? d.color : 'cyan';
					case 'handler': 
						return (d.color !== undefined)? d.color : 'blue';
				}
			}, 
			width: (d, elementName) => {
				switch (elementName) {
					case 'stick': return 2;
					case 'handler': return 4;
				}
			}, 
			height: (d, elementName) => {
				switch (elementName) {
					case 'handler': return 4;
				}
			}, 
			zIndex: (d, elementName) => {
				switch (elementName) {
					case 'marker': 
					case 'stick': 
					case 'handler': 
					case 'content': 
						return (d.zIndex !== undefined)? d.zIndex : 1;
				}
			}, 
			opacity: (d, elementName) => {
				switch (elementName) {
					case 'marker': 
					case 'stick': 
					case 'handler': 
					case 'content': 
						return (d.opacity !== undefined)? d.opacity : 1;
				}
			}, 
			visible: (d, elementName) => {
				switch (elementName) {
					case 'marker': 
					case 'stick': 
					case 'handler': 
					case 'content': 
						return (d.visible !== undefined)? d.visible : true; 
				}
			},
			innerHTML: (d, outerHTML) => {
				return d.innerHTML;
			}
		};

		this._.autoRefresh = true;

	}

	refresh() {
		var markers = this._.$el.querySelectorAll('marker');

		for (let i=0; i<markers.length; i++) {
			let marker = markers[i];
			let datum = this.get_datum(marker.dataset.hash);
			if (datum !== undefined) 
				this.set(datum);
			else 
				marker.remove();
		}
	}

	set(datum) {
		let hash = this.get_hash(datum);
		var marker, handler, stick, content;
		
		marker = this._.datumHashToDOM.get(hash);

		if (marker) {
			content = segment.querySelector('content');
			stick = segment.querySelector('stick');
			handler = segment.querySelector('handler');
		} else {
			marker = document.createElement('marker');
			content = document.createElement('content');
			stick = document.createElement('stick');
			handler = document.createElement('handler');

			marker.appendChild(content);
			marker.appendChild(stick);
			marker.appendChild(handler);

			this._.$el.appendChild(marker);

			this._.datumHashToDOM.set(hash, marker);
		}

		stick.dataset.hash = hash;
		stick.style.width = this._.accessors.width(datum, 'stick') + "px";
		stick.style.height = "100%";
		stick.style.position = 'absolute';
		stick.style.backgroundColor = this._.accessors.color(datum, 'stick');
		stick.style.opacity = this._.accessors.opacity(datum, 'stick');
		stick.style.display = (this._.accessors.visible(datum, 'stick'))? 'inline' : 'none';

		handler.dataset.hash = hash;
		handler.style.width = this._.accessors.width(datum, 'handler') + "px";
		handler.style.height = this._.accessors.height(datum, 'handler') + "px";
		handler.style.top = '0px';
		handler.style.position = 'absolute';
		handler.style.backgroundColor = this._.accessors.color(datum, 'handler');
		handler.style.opacity = this._.accessors.opacity(datum, 'handler');
		handler.style.display = (this._.accessors.visible(datum, 'handler'))? 'inline' : 'none';

		marker.dataset.hash = hash;
		marker.style.position = "absolute";
		marker.style.left = this._.timeToPixel(this._.accessors.time(datum)) + "px";
		marker.style.bottom = "0px";
		marker.style.height = "100%";
		marker.style.zIndex = this._.accessors.zIndex(datum, 'marker');
		marker.style.opacity = this._.accessors.opacity(datum, 'marker');
		marker.style.display = (this._.accessors.visible(datum, 'marker'))? 'inline' : 'none';

		content.dataset.hash = hash;
		content.style.position = "absolute";
		content.innerHTML = "";
		let innerHTML = this._.accessors.innerHTML(datum, marker);
		if (innerHTML instanceof Node)
			content.appendChild(innerHTML);
		content.style.opacity = this._.accessors.opacity(datum, 'content');
		content.style.display = (this._.accessors.visible(datum, 'content'))? 'inline' : 'none';

		return marker;
	}

	remove(datum) {
		let hash = this.get_hash(datum);
		var domEl = this._.datumHashToDOM.get(hash);
		if (domEl) {
			domEl.remove();
			this._.datumHashToDOM.delete(hash);
		} 
	}

	get_hash(datum) {
		throw new Error('not implemented');
	}

	get_datum(hash) {
		throw new Error('not implemented');
	}

	accessor(id, fn) {
		if (fn !== undefined) {
			this._.accessors[id] = fn;

			if (this.autoRefresh) 
				this.refresh();
		}

		return this._.accessors[id];
	}

	// Getters & Setters
	get autoRefresh() {
		return this._.autoRefresh;
	}

	set autoRefresh(v) {
		this._.autoRefresh = v;
	}

	get width() {
		// TODO: watch out for the values with no 'px' at the end!
		return Number(this._.$el.style.width.substring(0, this._.$el.style.width.length-2));
	}

	set width(v) {
		let layerWidth = v;

		this._.timeToPixel.range([0, layerWidth]);

		this._.$el.style.width = layerWidth + "px";

		if (this.autoRefresh)
			this.refresh();
	}

	get height() {
		// TODO: watch out for the values with no 'px' at the end!
		return Number(this._.$el.height.width.substring(0, this._.$el.style.height.length-2));
	}

	set height(v) {
		let layerHeight = v;

		this._.valueToPixel.range([0, layerHeight]);

		this._.$el.style.height = layerHeight + "px";

		if (this.autoRefresh)
			this.refresh();
	}

	get timeDomain() {
		return this._.timeDomain;
	}

	set timeDomain(v) {
		// TODO: check if v[0] < v[1]
		this._.timeDomain = v;

		this._.timeToPixel.domain(this._.timeDomain);

		if (this.autoRefresh)
			this.refresh();
	}

	get valueDomain() {
		return this._.valueDomain;
	}

	set valueDomain(v) {
		// TODO: check if v[0] < v[1]
		this._.valueDomain = v;

		this._.valueToPixel.domain(this._.valueDomain);

		if (this.autoRefresh)
			this.refresh();
	}

	get layerDomEl() {
		return this._.$el;
	}

	// Events Listeners
	get silent() {
		switch (this._.$el.style.pointerEvents) {
			case 'none':
				return true;
			default:
				return false;
		}
	}

	set silent(v) {
		if (v === true) {
			this._.$el.style.pointerEvents = 'none';
		} else {
			this._.$el.style.pointerEvents = 'auto';
		}
	}

	on(eventType, listenerFn) {
		this._.$el.addEventListener(eventType, listenerFn);
	}

	off(eventType, listenerFn) {
		this._.$el.removeEventListener(eventType, listenerFn);
	}
}