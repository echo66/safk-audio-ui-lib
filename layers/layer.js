'use strict'

class Layer {

	/* 
	 {
		height: Number, 
		width: Number, 
		defaultIterator: Iterator (my custom spec), 
		timeDomain: Array(2), 
		valueDomain: Array(2), 
		layerTagName: String, 
		layerElementTagName: String, 
		layerElementDatumHashAttribute: String
	 }
	 */
	constructor(params) {
		const that = this;
		this._ = {};
		params = params || {};

		this._.layerElementTagName = params.layerElementTagName;
		this._.layerElementDatumHashAttribute = params.layerElementDatumHashAttribute;

		this._.timeToPixel = linear();
		this._.valueToPixel = linear();

		let layerHeight = params.height;
		let layerWidth = params.width;

		this._.timeDomain = params.timeDomain;
		this._.valueDomain = params.valueDomain;
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

		this._.autoRefresh = true;

		this._.defaultIterator = params.defaultIterator;

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
		let layerElements = this._.$el.querySelectorAll(this._.layerElementTagName);
		for (let i=0; i<layerElements.length; i++) {
			let layerElement = layerElements[i];
			this._remove(layerElement, layerElement.getAttribute(this._.layerElementDatumHashAttribute));
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
			var layerElements = this._.$el.querySelectorAll(this._.layerElementTagName);

			for (let i=0; i<layerElements.length; i++) {
				let layerElement = layerElements[i];
				let datum = this.get_datum(layerElement.getAttribute(this._.layerElementDatumHashAttribute));
				this.set(datum);
			}
		}
	}

	set(datum) {
		throw new Error('not implemented');
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