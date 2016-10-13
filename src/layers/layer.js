'use strict'

import { List } from '../utils/list.js';
import { EventEmitter } from '../utils/event-emitter.js';
import { linear } from '../utils/linear-scale.js';

class Layer extends EventEmitter {

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
		super();
		const that = this;
		this._ = {};
		params = params || {};

		this._.layerTagName = params.layerTagName || 'div';
		this._.layerElementTagName = params.layerElementTagName;
		this._.layerElementDatumHashAttribute = params.layerElementDatumHashAttribute;
		this._.safkCustomProperty = params.safkCustomProperty || 'safk';

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
		this._.$el[that._.safkCustomProperty] = {};
		this._.$el[that._.safkCustomProperty].layer = this;

		this._.create_main_container_element =  params.create_main_container_element || function() {
			var $container = document.createElement('div');
			$container.setAttribute('name', 'layer-elements-container');
			$container.style.position = "relative";
			$container.style.width = layerWidth + "px";
			$container.style.height = layerHeight + "px";
			$container.style.left = "0px";
			$container.style.top = "0px";

			return $container;
		};

		this._.$container = this._.create_main_container_element({ layerWidth: layerWidth, layerHeight: layerHeight });
		this._.main_container_element_attribute = params.main_container_element_attribute || function($container, attribute, value) {
			switch (attribute) {
				case 'top': 
					$container.style.top = value;
					break;
				case 'left': 
					$container.style.left = value;
					break;
				case 'height': 
					$container.style.height = value;
					break;
				case 'width': 
					$container.style.width = value;
					break;
			}
		};
		this._.add_element_to_main_container_element = params.add_element_to_main_container_element || function($container, $el) {
			$container.appendChild($el);
		};

		this._.$el.appendChild(this._.$container);


		this._.create_interactions_container_element = params.create_interactions_container_element || function() {
			var $interactions = document.createElement('div');
			$interactions.setAttribute('name', 'layer-interactions-container');
			$interactions.style.position = "relative";
			$interactions.style.width = layerWidth + "px";
			$interactions.style.height = layerHeight + "px";
			$interactions.style.left = "0px";
			$interactions.style.top = "0px";
			$interactions.style.pointerEvents = "none";

			return $interactions;
		};

		this._.$interactions = this._.create_interactions_container_element({ layerWidth: layerWidth, layerHeight: layerHeight });
		this._.interactions_container_element_attribute = params.interactions_container_element_attribute || function($interactions, attribute, value) {
			switch (attribute) {
				case 'top': 
					$interactions.style.top = value;
					break;
				case 'left': 
					$interactions.style.left = value;
					break;
				case 'height': 
					$interactions.style.height = value;
					break;
				case 'width': 
					$interactions.style.width = value;
					break;
			}
		};

		this._.$el.appendChild(this._.$interactions);

		this._.$container.style.zIndex = 1;
		this._.$interactions.style.zIndex = 2;

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
										activeElsListIt: undefined, 
										start: function(layer) {
											this.entry.value = undefined;
											this.entry.done = false;
											this.activeElsListIt = that._.activeElsList.iterator();
										}, 
										next: function() {
											var entry = this.activeElsListIt.next();

											if (!entry.done) {
												var $el = entry.value;
												var hash = $el[that._.safkCustomProperty].datumHash;
												var datum = that.get_datum(hash);
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
											this.activeElsListIt = undefined;
										}
									};
	}

	destroy() {
		while (this._.activeElsList.size) {
			var $el = this._.activeElsList.pop();
			this.unassociate_element_to($el, $el.getAttribute(this._.layerElementDatumHashAttribute));
			delete $el[this._.safkCustomProperty];
		}
		while (this._.unusedElsList.size) {
			var $el = this._.unusedElsList.pop();
			delete $el[this._.safkCustomProperty];
		}
		while (this._.auxElsList.size) {
			var $el = this._.auxElsList.pop();
			delete $el[this._.safkCustomProperty];
		}
		// this._.activeElsList.clear();
		// this._.unusedElsList.clear();
		// this._.auxElsList.clear();

		this._.$el.remove();

		delete this._;
		delete this.timeDomain;
		delete this.valueDomain;
	}

	removeUnused() {
		while (this._.unusedElsList.size) {
			var unused = this._.unusedElsList.pop();
			unused[this._.safkCustomProperty].destroy && unused[this._.safkCustomProperty].destroy();
			unused.remove();
		}
	}

	update(iterator, canOverwrite) {
		// const that = this;

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

		$el.style.display = "none";

		if (!$el.parentElement) 
			this._.add_element_to_main_container_element(this._.$container, $el);

		return $el;
	}

	unset(datum) {
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
		this._.activeElsList.remove($el);
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
		var $el;
		if (canOverwrite === true) {
			$el = this._.activeElsList.pop() || 
					this._.unusedElsList.pop() || 
					this.create_element();
			this._.auxElsList.push($el);
		} else {
			$el = this.get_element(this.get_hash(datum)) || 
					this._.unusedElsList.pop() || 
					this.create_element();
			var unused = $el.getAttribute('unused');
			if (unused === 'true' || unused === null)
				this._.activeElsList.push($el);
		}

		var hash = this.get_hash(datum);

		this.associate_element_to($el, hash);

		return $el;
	}

	/*
	 *	Associate a DOM (or, in specific cases, the rendered object) to a datum hash.
	 */
	associate_element_to($el, hash) {
		$el.setAttribute(this._.layerElementDatumHashAttribute, hash);
		$el.setAttribute('unused', false);
		$el[this._.safkCustomProperty] = $el[this._.safkCustomProperty] || {};
		$el[this._.safkCustomProperty].layer = this;
		$el[this._.safkCustomProperty].datumHash = hash;
		// $el.datum = this.get_datum(hash);
	}

	/*
	 * Return the DOM (or, in specific cases, the rendered object) associated with the datum hash.
	 */
	get_element(hash) {
		return this._.$el.querySelector(this._.layerElementTagName + '[' + this._.layerElementDatumHashAttribute + '="' + hash + '"]');
	}

	get_datum_from_element($el) {
		if (this.has_element($el)) {
			return this.get_datum($el[this._.safkCustomProperty].datumHash);
		}
		return undefined;
	}

	has_element($el) {
		return this._.activeElsList.has($el) && $el[this._.safkCustomProperty].layer === this;
	}

	/*
	 * Remove the DOM (or, in specific cases, the rendered object) associated with the datum hash.
	 */
	unassociate_element_to($el, hash) {
		$el.removeAttribute(this._.layerElementDatumHashAttribute);
		delete $el[this._.safkCustomProperty].datumHash;
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

	get_horizontal_pixel_value(time) {
		// TODO
	}

	get_vertical_pixel_value(value) {
		// TODO
	}

	get_time(pixels) {
		return this._.timeToPixel.invert(pixels) + this._.timeOffset;
	}

	get_value(pixels) {
		return this._.valueToPixel.invert(pixels) + this._.valueOffset;
	}

	// Getters & Setters
	get elements() {
		return this._.activeElsList.iterator();
	}

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
		this._.main_container_element_attribute(this._.$container, 'width', layerWidth + "px");
		this._.interactions_container_element_attribute(this._.$interactions, 'width', layerWidth + "px");

		if (this.autoRefresh)
			this.update();

		this._.onchange && this._.onchange('width', layerWidth);

		this.emit('changed-property-width');
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
		this._.main_container_element_attribute(this._.$container, 'height', layerHeight + "px");
		this._.interactions_container_element_attribute(this._.$interactions, 'height', layerHeight + "px");

		if (this.autoRefresh)
			this.update();

		this._.onchange && this._.onchange('height', layerHeight);

		this.emit('changed-property-height');
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

		this._.main_container_element_attribute(this._.$container, 'left', (this._.timeToPixel(-this._.timeOffset)) + 'px');
		this._.interactions_container_element_attribute(this._.$interactions, 'left', (this._.timeToPixel(-this._.timeOffset)) + 'px');

		this.emit('changed-property-timeDomain');

		if (sameInterval) {
			if (this.refreshOnScroll) {
				// console.log('updating');
				this.update();
			}
		} else {
			if (this.autoRefresh) {
				// console.log('updating');
				this.update();
			}
		}

		// this.emit('changed-property-timeDomain');
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

		this.emit('changed-property-visible');
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

		this._.main_container_element_attribute(this._.$container, 'top', (this._.valueToPixel(this._.valueOffset)) + "px");
		this._.interactions_container_element_attribute(this._.$interactions, 'top', (this._.valueToPixel(this._.valueOffset)) + "px");

		this.emit('changed-property-valueDomain');

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

		// this.emit('changed-property-valueDomain');
	}

	get layerDomEl() {
		return this._.$el;
	}

	get mainDomEl() {
		return this._.$container;
	}

	get interactionsDomEl() {
		return this._.$interactions;
	}

	get defaultIterator() {
		return this._.defaultIterator;
	}

	set defaultIterator(v) {
		this._.defaultIterator = v;
	}

	get safkCustomProperty() {
		return this._.safkCustomProperty;
	}

	get layerTagName() {
		return this._.layerTagName;
	}

	get layerElementTagName() {
		return this._.layerElementTagName;
	}

	get layerElementDatumHashAttribute() {
		return this._.layerElementDatumHashAttribute;
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

		this.emit('changed-property-silent');
	}

}

export { Layer };