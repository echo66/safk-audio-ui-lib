'use strict'

class SegmentsLayer {
	
	constructor(params) {
		const that = this;
		this._ = {};
		params = params || {};

		this._.timeToPixel = linear();
		this._.valueToPixel = linear();

		let layerHeight = (params.height !== undefined)? params.height : 100;
		let layerWidth = (params.width !== undefined)? params.width : 500;

		this._.timeDomain = params.timeDomain || [0, 20];
		this._.valueDomain = params.valueDomain || [0, 1];
		this._.timeDomainProxy = new Proxy(this._.timeDomain, {
			get: (target, name) => {
				return target[name];
			}, 
			set: (obj, prop, value) => {
				obj[prop] = value;
				that._.timeToPixel.domain(obj);
				if (that.autoRefresh) 
					that.refresh();
			}
		});
		this._.valueDomainProxy = new Proxy(this._.valueDomain, {
			get: (target, name) => {
				return target[name];
			}, 
			set: (obj, prop, value) => {
				obj[prop] = value;
				that._.valueToPixel.domain(obj);
				if (that.autoRefresh) 
					that.refresh();
			}
		});

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
			duration: (d) => {
				return d.duration;
			}, 
			color: (d, elementName) => {
				switch (elementName) {
					case 'background': 
						return (d.backgroundColor !== undefined)? d.backgroundColor : 'cyan';
					case 'right-handler': 
					case 'left-handler': 
					case 'bottom-handler': 
					case 'top-handler': 
						return (d.handlerColor !== undefined)? d.handlerColor : 'blue';
				}
			}, 
			width: (d, elementName) => {
				switch (elementName) {
					case 'right-handler': 
					case 'left-handler': 
					case 'bottom-handler': 
					case 'top-handler': 
						return (d.handlerWidth !== undefined)? d.handlerWidth : 2;
				}
			}, 
			zIndex: (d, elementName) => {
				switch (elementName) {
					case 'right-handler': 
					case 'left-handler': 
					case 'bottom-handler': 
					case 'top-handler': 
					case 'segment': 
					case 'background': 
					case 'content': 
						return (d.zIndex !== undefined)? d.zIndex : 1;
				}
			}, 
			opacity: (d, elementName) => {
				switch (elementName) {
					case 'right-handler': 
					case 'left-handler': 
					case 'bottom-handler': 
					case 'top-handler': 
					case 'segment': 
					case 'background': 
					case 'content': 
						return (d.opacity !== undefined)? d.opacity : 1;
				}
			}, 
			visible: (d, elementName) => {
				switch (elementName) {
					case 'right-handler': 
					case 'left-handler': 
					case 'bottom-handler': 
					case 'top-handler': 
					case 'segment': 
					case 'background': 
					case 'content': 
						return (d.visible !== undefined)? d.visible : true; 
				}
			}, 
			lowValue: (d) => {
				return (d.lowValue !== undefined)? d.lowValue : 0;
			},
			highValue: (d) => {
				return (d.highValue !== undefined)? d.highValue : 1;
			}, 
			innerHTML: (d, outerHTML) => {
				return d.innerHTML;
			}, 
		};

		this._.autoRefresh = true;

		this._.defaultIterator = undefined;

		this._.unusedDomElsList = new Object();
		this._.unusedDomElsList.firstEl = undefined;
		this._.unusedDomElsList.lastEl = undefined;
		this._.unusedDomElsList.size = 0;
		this._.unusedDomElsList.pop = function() {
			if (this.firstEl) {
				let el = this.firstEl;
				this.firstEl = this.firstEl.nextEl;
				if (this.firstEl === undefined)
					this.lastEl = undefined;
				delete el.nextEl;
				this.size--;
				return el;
			}
			return undefined;
		}.bind(this._.unusedDomElsList);
		this._.unusedDomElsList.push = function(el) {
			if (!this.firstEl) {
				this.firstEl = this.lastEl = el;
				el.nextEl = undefined;
			} else if (this.lastEl) {
				this.lastEl.nextEl = el;
				this.lastEl = el;
				el.nextEl = undefined;
			} else {
				this.firstEl = this.lastEl = el;
				el.nextEl = undefined;
			}
			this.size++;
		}.bind(this._.unusedDomElsList);
	}

	clear() {
		this._.datumHashToDOM.clear();
		let segments = this._.$el.querySelectorAll('segment');
		for (let i=0; i<segments.length; i++) {
			let segment = segments[i];
			this._remove(segment, segment.dataset.hash);
		}
	}

	refill(iterator) {
		this.clear();
		this.refresh(iterator);
	}

	refresh(iterator) {
		iterator = iterator || this.defaultIterator;
		if (iterator) {
			iterator.start(this);
			let entry = iterator.next();
			while (!entry.done) {
				this.set(entry.value);
				entry = iterator.next();
			}
			iterator.stop();
		} else {
			var segments = this._.$el.querySelectorAll('segment');

			for (let i=0; i<segments.length; i++) {
				let segment = segments[i];
				let datum = this.get_datum(segment.dataset.hash);
				this.set(datum);
			}
		}
	}

	set(datum) {
		let hash = this.get_hash(datum);
		var segment, background, content, leftHandler, 
		rightHandler, topHandler, bottomHandler;
		
		segment = this._.datumHashToDOM.get(hash);

		if (segment) {

			background = segment.querySelector('background');
			content = segment.querySelector('content');
			leftHandler = segment.querySelector('handler[left-handler]');
			rightHandler = segment.querySelector('handler[right-handler]');
			topHandler = segment.querySelector('handler[top-handler]');
			bottomHandler = segment.querySelector('handler[bottom-handler]');

		} else if (segment = this._.unusedDomElsList.pop()) {

			background = segment.querySelector('background');
			content = segment.querySelector('content');
			leftHandler = segment.querySelector('handler[left-handler]');
			rightHandler = segment.querySelector('handler[right-handler]');
			topHandler = segment.querySelector('handler[top-handler]');
			bottomHandler = segment.querySelector('handler[bottom-handler]');

			this._.$el.appendChild(segment);

			this._.datumHashToDOM.set(hash, segment);

		} else {

			segment = document.createElement('segment');
			background = document.createElement('background');
			content = document.createElement('content');
			leftHandler = document.createElement('handler');
			rightHandler = document.createElement('handler');
			topHandler = document.createElement('handler');
			bottomHandler = document.createElement('handler');

			segment.appendChild(background);
			segment.appendChild(content);
			segment.appendChild(leftHandler);
			segment.appendChild(rightHandler);
			segment.appendChild(topHandler);
			segment.appendChild(bottomHandler);

			this._.$el.appendChild(segment);

			this._.datumHashToDOM.set(hash, segment);

		}

		segment.removeAttribute('unused');

		segment.dataset.hash = hash;
		segment.datum = datum;
		segment.style.overflow = "hidden";
		segment.style.width = this._.timeToPixel(this._.accessors.duration(datum) + this._.timeDomain[0]) + "px";
		segment.style.left = this._.timeToPixel(this._.accessors.time(datum)) + "px";
		segment.style.bottom = this._.valueToPixel(this._.accessors.lowValue(datum)) + "px";
		segment.style.height = (this._.valueToPixel(this._.accessors.highValue(datum)) - this._.valueToPixel(this._.accessors.lowValue(datum))) + "px";
		segment.style.zIndex = this._.accessors.zIndex(datum, 'segment');
		segment.style.opacity = this._.accessors.opacity(datum, 'segment');
		segment.style.display = (this._.accessors.visible(datum, 'segment'))? 'inline' : 'none';

		leftHandler.dataset.hash = hash;
		leftHandler.setAttribute('left-handler', true);
		leftHandler.style.height = "100%";
		leftHandler.style.bottom = "0px";
		leftHandler.style.left = "0px";
		leftHandler.style.width = this._.accessors.width(datum, 'left-handler') + "px";
		leftHandler.style.backgroundColor = this._.accessors.color(datum, 'left-handler');
		leftHandler.style.position = "absolute";
		leftHandler.style.opacity = this._.accessors.opacity(datum, 'left-handler');
		leftHandler.style.display = (this._.accessors.visible(datum, 'left-handler'))? 'inline' : 'none';

		rightHandler.dataset.hash = hash;
		rightHandler.setAttribute('right-handler', true);
		rightHandler.style.height = "100%";
		rightHandler.style.bottom = "0px";
		rightHandler.style.left = (this._.timeToPixel(this._.accessors.duration(datum) + this._.timeDomain[0]) - this._.accessors.width(datum, 'right-handler')) + "px";
		rightHandler.style.width = this._.accessors.width(datum, 'right-handler') + "px";
		rightHandler.style.backgroundColor = this._.accessors.color(datum, 'right-handler');
		rightHandler.style.position = "absolute";
		rightHandler.style.opacity = this._.accessors.opacity(datum, 'right-handler');
		rightHandler.style.display = (this._.accessors.visible(datum, 'right-handler'))? 'inline' : 'none';

		topHandler.dataset.hash = hash;
		topHandler.setAttribute('top-handler', true);
		topHandler.style.height = this._.accessors.width(datum, 'top-handler') + "px";
		// topHandler.style.bottom = "0px";
		topHandler.style.left = "0px";
		topHandler.style.width = "100%";
		topHandler.style.backgroundColor = this._.accessors.color(datum, 'top-handler');
		topHandler.style.position = "absolute";
		topHandler.style.opacity = this._.accessors.opacity(datum, 'top-handler');
		topHandler.style.display = (this._.accessors.visible(datum, 'top-handler'))? 'inline' : 'none';

		bottomHandler.dataset.hash = hash;
		bottomHandler.setAttribute('bottom-handler', true);
		bottomHandler.style.height = this._.accessors.width(datum, 'bottom-handler') + "px";
		bottomHandler.style.bottom = "0px";
		bottomHandler.style.left = "0px";
		bottomHandler.style.width = "100%";
		bottomHandler.style.backgroundColor = this._.accessors.color(datum, 'bottom-handler');
		bottomHandler.style.position = "absolute";
		bottomHandler.style.opacity = this._.accessors.opacity(datum, 'bottom-handler');
		bottomHandler.style.display = (this._.accessors.visible(datum, 'bottom-handler'))? 'inline' : 'none';

		background.dataset.hash = hash;
		background.style.width = '100%';
		background.style.height = '100%';
		background.style.position = 'absolute';
		background.style.backgroundColor = this._.accessors.color(datum, 'background');
		background.style.opacity = this._.accessors.opacity(datum, 'background');
		background.style.display = (this._.accessors.visible(datum, 'background'))? 'inline' : 'none';

		content.dataset.hash = hash;
		content.style.position = "absolute";
		content.innerHTML = "";
		let innerHTML = this._.accessors.innerHTML(datum, segment);
		if (innerHTML instanceof Node)
			content.appendChild(innerHTML);
		content.style.opacity = this._.accessors.opacity(datum, 'content');
		content.style.display = (this._.accessors.visible(datum, 'content'))? 'inline' : 'none';

		return segment;
	}

	remove(datum) {
		let hash = this.get_hash(datum);
		var domEl = this._.datumHashToDOM.get(hash);
		if (domEl) {
			this._remove(domEl, hash);
		} 
	}

	_remove(domEl, hash) {
		// domEl.remove();
		delete domEl.dataset.hash;
		domEl.style.display = "none";
		domEl.setAttribute('unused', true);
		delete domEl.datum;
		this._.datumHashToDOM.delete(hash);
		this._.unusedDomElsList.push(domEl);
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
		v = Number(v);

		if (isNaN(v))
			return;
		
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
		v = Number(v);

		if (isNaN(v))
			return;

		let layerHeight = v;

		this._.valueToPixel.range([0, layerHeight]);

		this._.$el.style.height = layerHeight + "px";

		if (this.autoRefresh)
			this.refresh();
	}

	get timeDomain() {
		return this._.timeDomainProxy;
	}

	set timeDomain(v) {
		if (isNaN(v[0]) || isNaN(v[1]) || v[0] >= v[1])
			return;

		this._.timeDomain[0] = v[0];
		this._.timeDomain[1] = v[1];

		this._.timeToPixel.domain(this._.timeDomain);

		if (this.autoRefresh)
			this.refresh();
	}

	get valueDomain() {
		return this._.valueDomainProxy;
	}

	set valueDomain(v) {
		if (isNaN(v[0]) || isNaN(v[1]) || v[0] >= v[1])
			return;

		this._.valueDomain[0] = v[0];
		this._.valueDomain[1] = v[1];

		this._.valueToPixel.domain(this._.valueDomain);

		if (this.autoRefresh)
			this.refresh();
	}

	get layerDomEl() {
		return this._.$el;
	}

	get defaultIterator() {
		return this._.defaultIterator;
	}

	set defaultIterator(v) {
		this._.defaultIterator = v;
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