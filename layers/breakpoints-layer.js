'use strict'

class BreakpointsLayer {

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
			value: (d) => {
				return d.value;
			}, 
			radius: (d) => {
				return d.radius || 2;
			}, 
			color: (d, elementName) => {
				switch (elementName) {
					case 'point': 
					case 'text': 
						return (d.color !== undefined)? d.color : 'blue';
				}
			}, 
			text: (d) => {
				return '';
			}, 
			textOffset: (d, axis) => {
				switch (axis) {
					case 'x':
					case 'y':
						return 0;
				}
			}, 
			fontFamily: (d) => {
				return 'Verdana';
			}, 
			fontSize: (d) => {
				return 10;
			}, 
			opacity: (d, elementName) => {
				switch (elementName) {
					case 'points-surface': 
					case 'point': 
					case 'text': 
					case 'group': 
						return (d.opacity !== undefined)? d.opacity : 1;
				}
			}, 
			zIndex: (d, elementName) => {
				switch (elementName) {
					case 'point':
					case 'text': 
					case 'group': 
						return (d.zIndex !== undefined)? d.zIndex : 1;
				}
			},
			visible: (d, elementName) => {
				switch (elementName) {
					case 'point':
					case 'text': 
					case 'group': 
						return (d.visible !== undefined)? d.visible : true; 
				}
			}
		};

		this._.autoRefresh = true;

		this._.pointsSVG = document.createElementNS("http://www.w3.org/2000/svg", 'svg');

		this._.$el.appendChild(this._.pointsSVG);

		this._.pointsSVG.setAttributeNS(null, 'width', '100%');
		this._.pointsSVG.setAttributeNS(null, 'height', '100%');
		this._.pointsSVG.style.position = "absolute";
		this._.pointsSVG.style.zIndex = 1;
		this._.pointsSVG.style.transform = "scale(1,-1)";

	}

	refresh() {
		var points = this._.$el.querySelectorAll('g');

		for (let i=0; i<points.length; i++) {
			let point = points[i];
			let datum = this.get_datum(point.getAttribute('data-hash'));
			if (datum !== undefined) 
				this.set(datum);
			else 
				point.remove();
		}
	}

	set(datum) {
		let hash = this.get_hash(datum);
		var group, point, text;
		
		group = this._.datumHashToDOM.get(hash);

		if (group) {
			point = group.querySelector('circle');
			text  = group.querySelector('text');
		} else {
			group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
			point = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
			text = document.createElementNS("http://www.w3.org/2000/svg", 'text');

			group.appendChild(point);
			group.appendChild(text);
			this._.pointsSVG.appendChild(group);

			this._.datumHashToDOM.set(hash, group);
		}

		group.setAttribute('data-hash', hash);
		group.setAttributeNS(null, 'transform', 'translate(' + 
													this._.timeToPixel(this._.accessors.time(datum)) + ' ' + 
													this._.valueToPixel(this._.accessors.value(datum)) + ') ' + 
													'scale(1, -1)');
		// group.setAttributeNS(null, 'x', this._.timeToPixel(this._.accessors.time(datum)));
		// group.setAttributeNS(null, 'y', this._.valueToPixel(this._.accessors.value(datum)));

		text.setAttribute('data-hash', hash);
		text.setAttributeNS(null, 'x', this._.accessors.textOffset(datum, 'x'));
		text.setAttributeNS(null, 'y', this._.accessors.textOffset(datum, 'y'));
		text.setAttributeNS(null, 'fill', this._.accessors.color(datum, 'text'));
		text.setAttributeNS(null, 'font-size', this._.accessors.fontSize(datum));
		text.setAttributeNS(null, 'font-family', this._.accessors.fontFamily(datum));
		text.style.opacity = this._.accessors.opacity(datum, 'text');
		text.style.display = (this._.accessors.visible(datum, 'text'))? 'inline' : 'none';
		text.innerHTML = this._.accessors.text(datum);

		point.setAttribute('data-hash', hash);
		point.setAttributeNS(null, 'cx', 0);
		point.setAttributeNS(null, 'cy', 0);
		point.setAttributeNS(null, 'r', this._.accessors.radius(datum));
		point.style.fill = this._.accessors.color(datum, 'point');
		point.style.opacity = this._.accessors.opacity(datum, 'point');
		point.style.display = (this._.accessors.visible(datum, 'point'))? 'inline' : 'none';
		point.style.zIndex = this._.accessors.zIndex(datum, 'point');

		return group;
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