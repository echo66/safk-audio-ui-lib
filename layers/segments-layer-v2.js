'use strict'

// import { Layer } from 'layer.js';

class SegmentsLayer extends Layer {

	constructor(params) {
		super({
			height: params.height || 100, 
			width: params.width || 500, 
			defaultIterator: undefined, 
			timeDomain: params.timeDomain || [0, 20], 
			valueDomain: params.valueDomain || [0, 1], 
			layerTagName: 'layer', 
			layerElementTagName: 'segment', 
			layerElementDatumHashAttribute: 'data-hash'
		});

		// DEFINE ACCESSORS
		{
			this.accessor('time', (d) => { 
				return d.time; 
			});
			this.accessor('duration', (d) => { 
				return d.duration;
			});
			this.accessor('color', (d, elementName) => { 
				/*
				 * 'right-handler' 'left-handler' 'bottom-handler' 
				 * 'top-handler' 'background'
				 */
				if (elementName === 'background') 
					return (d.backgroundColor !== undefined)? d.backgroundColor : 'cyan'
				else
					return (d.handlerColor !== undefined)? d.handlerColor : 'blue';
			});
			this.accessor('width', (d, elementName) => { 
				/*
				 * 'right-handler' 'left-handler' 
				 * 'bottom-handler' 'top-handler'
				 */
				return (d.handlerWidth !== undefined)? d.handlerWidth : 2;
			});
			this.accessor('zIndex', (d, elementName) => { 
				/*
				 * 'right-handler' 'left-handler' 'bottom-handler' 
				 * 'top-handler' 'segment' 'background' 'content'
				 */
				return (d.zIndex !== undefined)? d.zIndex : 1;
			});
			this.accessor('opacity', (d, elementName) => { 
				/*
				 * 'right-handler' 'left-handler' 'bottom-handler' 
				 * 'top-handler' 'segment' 'background' 'content'
				 */
				return (d.opacity !== undefined)? d.opacity : 1;
			});
			this.accessor('visible', (d, elementName) => { 
				/*
				 * 'right-handler' 'left-handler' 'bottom-handler' 
				 * 'top-handler' 'segment' 'background' 'content'
				 */
				return (d.visible !== undefined)? d.visible : true; 
			});
			this.accessor('lowValue', (d) => { 
				return (d.lowValue !== undefined)? d.lowValue : 0;
			});
			this.accessor('highValue', (d) => { 
				return (d.highValue !== undefined)? d.highValue : 1;
			});
			this.accessor('innerHTML', (d, outerHTML) => { 
				return d.innerHTML;
			});
		}

		// this._.datumHashToDOM = new Map();
		
	}

	_configure_segment(segment, datum) {
		segment.removeAttribute('unused');
		// segment.dataset.hash = hash;
		// segment.datum = datum;
		segment.style.overflow = "hidden";
		segment.style.width = this._.timeToPixel(this._.accessors.duration(datum) + this._.timeDomain[0]) + "px";
		segment.style.left = this._.timeToPixel(this._.accessors.time(datum)) + "px";
		segment.style.bottom = this._.valueToPixel(this._.accessors.lowValue(datum)) + "px";
		segment.style.height = (this._.valueToPixel(this._.accessors.highValue(datum)) - this._.valueToPixel(this._.accessors.lowValue(datum))) + "px";
		segment.style.zIndex = this._.accessors.zIndex(datum, 'segment');
		segment.style.opacity = this._.accessors.opacity(datum, 'segment');
		segment.style.display = (this._.accessors.visible(datum, 'segment'))? 'inline' : 'none';

		return segment;
	}

	_configure_left_handler(leftHandler, datum) {
		// leftHandler.dataset.hash = hash;
		leftHandler.setAttribute('left-handler', true);
		leftHandler.style.height = "100%";
		leftHandler.style.bottom = "0px";
		leftHandler.style.left = "0px";
		leftHandler.style.width = this._.accessors.width(datum, 'left-handler') + "px";
		leftHandler.style.backgroundColor = this._.accessors.color(datum, 'left-handler');
		leftHandler.style.position = "absolute";
		leftHandler.style.opacity = this._.accessors.opacity(datum, 'left-handler');
		leftHandler.style.display = (this._.accessors.visible(datum, 'left-handler'))? 'inline' : 'none';

		return leftHandler;
	}

	_configure_right_handler(rightHandler, datum) {
		// rightHandler.dataset.hash = hash;
		rightHandler.setAttribute('right-handler', true);
		rightHandler.style.height = "100%";
		rightHandler.style.bottom = "0px";
		rightHandler.style.left = (this._.timeToPixel(this._.accessors.duration(datum) + this._.timeDomain[0]) - this._.accessors.width(datum, 'right-handler')) + "px";
		rightHandler.style.width = this._.accessors.width(datum, 'right-handler') + "px";
		rightHandler.style.backgroundColor = this._.accessors.color(datum, 'right-handler');
		rightHandler.style.position = "absolute";
		rightHandler.style.opacity = this._.accessors.opacity(datum, 'right-handler');
		rightHandler.style.display = (this._.accessors.visible(datum, 'right-handler'))? 'inline' : 'none';

		return rightHandler;
	}

	_configure_top_handler(topHandler, datum) {
		// topHandler.dataset.hash = hash;
		topHandler.setAttribute('top-handler', true);
		topHandler.style.height = this._.accessors.width(datum, 'top-handler') + "px";
		// topHandler.style.bottom = "0px";
		topHandler.style.left = "0px";
		topHandler.style.width = "100%";
		topHandler.style.backgroundColor = this._.accessors.color(datum, 'top-handler');
		topHandler.style.position = "absolute";
		topHandler.style.opacity = this._.accessors.opacity(datum, 'top-handler');
		topHandler.style.display = (this._.accessors.visible(datum, 'top-handler'))? 'inline' : 'none';

		return topHandler;
	}

	_configure_bottom_handler(bottomHandler, datum) {
		// bottomHandler.dataset.hash = hash;
		bottomHandler.setAttribute('bottom-handler', true);
		bottomHandler.style.height = this._.accessors.width(datum, 'bottom-handler') + "px";
		bottomHandler.style.bottom = "0px";
		bottomHandler.style.left = "0px";
		bottomHandler.style.width = "100%";
		bottomHandler.style.backgroundColor = this._.accessors.color(datum, 'bottom-handler');
		bottomHandler.style.position = "absolute";
		bottomHandler.style.opacity = this._.accessors.opacity(datum, 'bottom-handler');
		bottomHandler.style.display = (this._.accessors.visible(datum, 'bottom-handler'))? 'inline' : 'none';

		return bottomHandler;
	}
	
	_configure_background(background, datum) {
		// background.dataset.hash = hash;
		background.style.width = '100%';
		background.style.height = '100%';
		background.style.position = 'absolute';
		background.style.backgroundColor = this._.accessors.color(datum, 'background');
		background.style.opacity = this._.accessors.opacity(datum, 'background');
		background.style.display = (this._.accessors.visible(datum, 'background'))? 'inline' : 'none';

		return background;
	}

	_configure_content(content, segment, datum) {
		// content.dataset.hash = hash;
		content.style.position = "absolute";
		content.innerHTML = "";
		let innerHTML = this._.accessors.innerHTML(datum, segment);
		if (innerHTML instanceof Node)
			content.appendChild(innerHTML);
		content.style.opacity = this._.accessors.opacity(datum, 'content');
		content.style.display = (this._.accessors.visible(datum, 'content'))? 'inline' : 'none';

		return content;
	}

	set(datum) {
		let hash = this.get_hash(datum);
		var segment, background, content, leftHandler, 
		rightHandler, topHandler, bottomHandler;
		
		segment = this.get_element(hash);

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

			// this._.$el.appendChild(segment);

			this.associate_element_to(segment, hash);

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

			this.associate_element_to(segment, hash);

		}

		this._configure_segment(segment, datum);

		this._configure_left_handler(leftHandler, datum);

		this._configure_right_handler(rightHandler, datum);

		this._configure_top_handler(topHandler, datum);

		this._configure_bottom_handler(bottomHandler, datum);

		this._configure_background(background, datum);

		this._configure_content(content, segment, datum);

		return segment;
	}

	/*
	 *	Associate a DOM (or, in specific cases, the rendered object) to a datum hash.
	 */
	associate_element_to($el, hash) {
		// this._.datumHashToDOM.set(hash, $el);
		$el.setAttribute('data-hash', hash);
		$el.datum = this.get_datum(hash);	
	}

	/*
	 * Return the DOM (or, in specific cases, the rendered object) associated with the datum hash.
	 */
	get_element(hash) {
		// return this._.datumHashToDOM.get(hash);
		return this._.$el.querySelector('segment[data-hash="'+hash+'"]');
	}

	/*
	 * Remove the DOM (or, in specific cases, the rendered object) associated with the datum hash.
	 */
	unassociate_element_to($el, hash) {
		$el.removeAttribute('data-hash');
		delete $el.datum;
	}
}