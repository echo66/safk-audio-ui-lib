'use strict'

// import { List } from './list.js';

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

		this._.layerTagName = params.layerTagName;
		this._.layerElementTagName = params.layerElementTagName;
		this._.layerElementDatumHashAttribute = params.layerElementDatumHashAttribute;

		this._.timeToPixel = linear();
		this._.valueToPixel = linear();

		let layerHeight = params.height;
		let layerWidth = params.width;

		this._.$el = document.createElement(this._.layerTagName);
		// this._.$el.style.position = "absolute";
		// this._.$el.style.overflow = "hidden";
		this._.$el.style.display = "block";
		this._.$el.style.height = layerHeight + "px";
		this._.$el.style.width = layerWidth + "px";

		this._.$container = document.createElement('div');
		this._.$container.style.position = "relative";
		this._.$container.style.width = layerWidth + "px";
		this._.$container.style.height = layerHeight + "px";
		this._.$container.style.left = "0px";
		this._.$container.style.top = "0px";

		this._.layerElementsParent = this._.$container || params.layerElementsParent;

		this._.$el.appendChild(this._.$container);

		this._.timeDomain = params.timeDomain;
		this._.valueDomain = params.valueDomain;

		this._.timeDomainProxy = new Proxy(this._.timeDomain, {
			get: (target, prop) => {
				if (prop === "0") 
					return that._.timeOffset;
				else if (prop === "1") 
					return that._.timeOffset + that._.timeDomain[1];
				else 
					return target[prop];
			}, 
			set: (target, prop, value) => {
				if (prop === "0") {
					that._.timeDomain[1] = (that._.timeOffset + that._.timeDomain[1]) - value;
					that._.timeOffset = value;
				} else if (prop === "1" && value) {
					that._.timeDomain[1] = value - that._.timeOffset;
				} else {
					return;
				}
				that._.timeToPixel.domain(that._.timeDomain);

				if (that.autoRefresh) 
					that.update();
			}
		});
		this._.valueDomainProxy = new Proxy(this._.valueDomain, {
			get: (target, prop) => {
				if (prop === "0") 
					return that._.valueOffset;
				else if (prop === "1") 
					return that._.valueOffset + that._.valueDomain[1];
				else 
					return target[prop];
			}, 
			set: (target, prop, value) => {
				if (prop === "0") {
					that._.valueDomain[1] = (that._.valueOffset + that._.valueDomain[1]) - value;
					that._.valueOffset = value;
				} else if (prop === "1" && value) {
					that._.valueDomain[1] = value - that._.valueOffset;
				} else {
					return;
				}
				that._.valueToPixel.domain(that._.valueDomain);

				if (that.autoRefresh) 
					that.update();
			}
		});

		this.timeDomain = this._.timeDomain;
		this.valueDomain = this._.valueDomain;

		this._.timeToPixel.domain(this._.timeDomain).range([0, layerWidth]);
		this._.valueToPixel.domain(this._.valueDomain).range([0, layerHeight]);

		this._.accessors = {};

		this._.autoRefresh = true;
		this._.refreshOnScroll = false;

		this._.activeElsList = new List();
		this._.unusedElsList = new List();
		this._.auxElsList = new List();

		this._.defaultIterator = params.defaultIterator ||
									{
										entry: { value: undefined, done: false }, 
										start: function(layer) {
											this.entry.value = undefined;
											this.entry.done = false;
											this.nextActiveEl = that._.activeElsList.firstEl;
											this.listNexProp = that._.activeElsList.propertyName;
										}, 
										next: function() {
											if (this.nextActiveEl) {
												var hash = this.nextActiveEl.getAttribute(that._.layerElementDatumHashAttribute);
												var datum = that.get_datum(hash);
												this.nextActiveEl = this.nextActiveEl[this.listNexProp];
												this.entry.value = datum;
												this.entry.done = false;
											} else {
												this.entry.value = undefined;
												this.entry.done = true;
											}
											
											return this.entry;
										}, 
										stop: function() {
											this.entry.value = undefined;
											this.entry.done = false;
										}
									};
	}

	destroy() {
		this._.activeElsList.clear();
		this._.unusedElsList.clear();
		this._.auxElsList.clear();

		this._.$el.remove();

		delete this._;
		delete this.timeDomain;
		delete this.valueDomain;
	}

	update(iterator, canOverwrite) {
		const that = this;

		let alreadyVisible = this.visible;

		if (alreadyVisible) this.visible = false;

		iterator = iterator || this.defaultIterator;

		iterator.start(this);
		var entry = iterator.next();
		while (!entry.done) {
			var $el = this.allocate_element(entry.value);
			this.set(entry.value, $el);
			entry = iterator.next();
		}
		iterator.stop();

		if (canOverwrite) {
			while (this._.activeDomEls.size > 0) {
				var $el = this._.activeDomEls.pop();
				this._remove($el, $el.getAttribute(this._.layerElementDatumHashAttribute));
			}

			while (this._.auxElsList.size > 0) {
				var $el = this._.auxElsList.pop();
				this._.activeDomEls.push($el);
			}
		}

		if (alreadyVisible) this.visible = true;
	}

	set(datum, $el) {
		if (!$el)
			$el = this.allocate_element(datum, $el);

		if (!$el.parentElement) 
			this._.layerElementsParent.appendChild($el);

		$el.style.display = "none";

		return $el;
	}

	remove(datum) {
		let hash = this.get_hash(datum);
		let $el = this.get_element(hash);
		if ($el) {
			this._remove($el, hash);
		} 
	}

	_remove($el, hash) {
		$el.removeAttribute(this._.layerElementDatumHashAttribute);
		$el.style.display = "none";
		$el.setAttribute('unused', true);
		this.unassociate_element_to($el, hash);
		this._.unusedElsList.push($el);
	}

	get_hash(datum) {
		throw new Error('not implemented');
	}

	get_datum(hash) {
		throw new Error('not implemented');
	}

	create_element() {
		return document.createElement(this._.layerElementTagName);
	}

	/*
	 *
	 */
	allocate_element(datum, canOverwrite) {
		if (canOverwrite === true) {
			$el = this._.activeElsList.pop() || 
					this._.unusedElsList.pop() || 
					this.create_element();
			this._.auxElsList.push($el);
		} else {
			$el = this.get_element(this.get_hash(datum)) || 
					this._.unusedElsList.pop() || 
					this.create_element();
			if ($el.getAttribute('unused') === 'true')
				this._.activeElsList.push($el);
		}

		this.associate_element_to($el, this.get_hash(datum));

		return $el;
	}

	/*
	 *	Associate a DOM (or, in specific cases, the rendered object) to a datum hash.
	 */
	associate_element_to($el, hash) {
		$el.setAttribute(this._.layerElementDatumHashAttribute, hash);
		$el.setAttribute('unused', false);
		// $el.datum = this.get_datum(hash);
	}

	/*
	 * Return the DOM (or, in specific cases, the rendered object) associated with the datum hash.
	 */
	get_element(hash) {
		return this._.$el.querySelector(this._.layerElementTagName + '[' + this._.layerElementDatumHashAttribute + '="' + hash + '"]');
	}

	/*
	 * Remove the DOM (or, in specific cases, the rendered object) associated with the datum hash.
	 */
	unassociate_element_to($el, hash) {
		$el.removeAttribute(this._.layerElementDatumHashAttribute);
		// delete $el.datum;
	}

	accessor(id, fn) {
		if (fn !== undefined) {
			this._.accessors[id] = fn;

			if (this.autoRefresh) 
				this.update();
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

	get refreshOnScroll() {
		return this._.refreshOnScroll;
	}

	set refreshOnScroll(v) {
		this._.refreshOnScroll = v;
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
		this._.$container.style.width = layerWidth + "px";

		if (this.autoRefresh)
			this.update();

		this._.onchange && this._.onchange('width', layerWidth);
	}

	get height() {
		// TODO: watch out for the values with no 'px' at the end!
		return Number(this._.$el.style.height.substring(0, this._.$el.style.height.length-2));
	}

	set height(v) {
		v = Number(v);

		if (isNaN(v))
			return;

		let layerHeight = v;

		this._.valueToPixel.range([0, layerHeight]);

		this._.$el.style.height = layerHeight + "px";

		if (this.autoRefresh)
			this.update();

		this._.onchange && this._.onchange('height', layerHeight);
	}

	get timeDomain() {
		return this._.timeDomainProxy;
	}

	set timeDomain(v) {
		if (isNaN(v[0]) || isNaN(v[1]) || v[0] >= v[1])
			return;

		let sameInterval = (v[1] - v[0]) === (this._.timeDomain[1] - this._.timeDomain[0]);

		this._.timeDomain[0] = 0;
		this._.timeDomain[1] = v[1] - v[0];

		this._.timeOffset = v[0];

		this._.timeToPixel.domain(this._.timeDomain);

		this._.$el.children[0].style.left = (this._.timeToPixel(-this._.timeOffset)) + 'px';

		if (sameInterval) {
			if (this.refreshOnScroll) {
				console.log('updating');
				this.update();
			}
		} else {
			if (this.autoRefresh) {
				console.log('updating');
				this.update();
			}
		}
	}

	get visible() {
		if (this._.$el.style.display === "none") 
			return false;
		else
			return true;
	}

	set visible(v) {
		if (v) 
			this._.$el.style.display = "block";
		else
			this._.$el.style.display = "none";
	}

	get valueDomain() {
		return this._.valueDomainProxy;
	}

	set valueDomain(v) {
		if (isNaN(v[0]) || isNaN(v[1]) || v[0] >= v[1])
			return;

		let sameInterval = (v[1] - v[0]) === (this._.valueDomain[1] - this._.valueDomain[0]);

		this._.valueDomain[0] = 0;
		this._.valueDomain[1] = v[1] - v[0];

		this._.valueOffset = v[0];

		this._.valueToPixel.domain(this._.valueDomain);

		this._.$el.children[0].style.top = (this._.valueToPixel(this._.valueOffset)) + 'px';

		if (sameInterval) {
			if (this.refreshOnScroll) {
				console.log('updating');
				this.update();
			}
		} else {
			if (this.autoRefresh) {
				console.log('updating');
				this.update();
			}
		}
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

}