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
			layerTagName: params.layerTagName || 'layer', 
			layerElementTagName: params.layerElementTagName || 'segment', 
			layerElementDatumHashAttribute: params.layerElementTagName || 'data-hash'
		});

		const that = this;
		// DEFINE ACCESSORS
		{
			this.accessor('time', (d) => { 
				/*
				 */
				return d.time; 
			});
			this.accessor('duration', (d) => { 
				/*
				 */
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
				// return (d.visible !== undefined)? d.visible : true; 
				var t0 = that.timeDomain[0];
				var t1 = that.timeDomain[1];
				var deltaT = that._.accessors.time(d) - t0;
				var absDeltaT = Math.abs(deltaT);
				if (deltaT === 0) 
					return true;
				if (deltaT < 0 && absDeltaT < that._.accessors.duration(d)) 
					return true;
				else if (deltaT > 0 && absDeltaT < (t1 - t0))
					return true;
				else 
					return false;
			});
			this.accessor('lowValue', (d) => { 
				/*
				 */
				return (d.lowValue !== undefined)? d.lowValue : 0;
			});
			this.accessor('highValue', (d) => { 
				/*
				 */
				return (d.highValue !== undefined)? d.highValue : 1;
			});
		}
		
	}

	_configure_segment(segment, datum) {
		// segment.dataset.hash = hash;
		// segment.datum = datum;
		// segment.style.overflow = "hidden";
		segment.style.position = "absolute";
		// segment.style.width = this._.timeToPixel(this._.accessors.duration(datum) + this._.timeDomain[0]) + "px";
		segment.style.width = this._.timeToPixel(this._.accessors.duration(datum)) + "px";
		segment.style.left = this._.timeToPixel(this._.accessors.time(datum)) + "px";
		segment.style.bottom = this._.valueToPixel(this._.accessors.lowValue(datum)) + "px";
		segment.style.height = (this._.valueToPixel(this._.accessors.highValue(datum)) - this._.valueToPixel(this._.accessors.lowValue(datum))) + "px";
		segment.style.zIndex = this._.accessors.zIndex(datum, 'segment');
		segment.style.opacity = this._.accessors.opacity(datum, 'segment');
		segment.style.display = (this._.accessors.visible(datum, 'segment'))? 'block' : 'none';

		return segment;
	}

	_configure_left_handler(leftHandler, datum) {
		// leftHandler.dataset.hash = hash;
		leftHandler.setAttribute('left-handler', true);
		leftHandler.setAttribute('handler', 'left');
		leftHandler.style.height = "100%";
		leftHandler.style.bottom = "0px";
		leftHandler.style.left = "0px";
		leftHandler.style.width = this._.accessors.width(datum, 'left-handler') + "px";
		leftHandler.style.backgroundColor = this._.accessors.color(datum, 'left-handler');
		leftHandler.style.position = "absolute";
		leftHandler.style.zIndex = this._.accessors.zIndex(datum, 'left-handler');
		leftHandler.style.opacity = this._.accessors.opacity(datum, 'left-handler');
		leftHandler.style.display = (this._.accessors.visible(datum, 'left-handler'))? 'block' : 'none';

		return leftHandler;
	}

	_configure_right_handler(rightHandler, datum) {
		// rightHandler.dataset.hash = hash;
		rightHandler.setAttribute('right-handler', true);
		rightHandler.setAttribute('handler', 'right');
		rightHandler.style.height = "100%";
		rightHandler.style.bottom = "0px";
		// rightHandler.style.left = (this._.timeToPixel(this._.accessors.duration(datum) + this._.timeDomain[0]) - this._.accessors.width(datum, 'right-handler')) + "px";
		rightHandler.style.left = (this._.timeToPixel(this._.accessors.duration(datum)) - this._.accessors.width(datum, 'right-handler')) + "px";
		rightHandler.style.width = this._.accessors.width(datum, 'right-handler') + "px";
		rightHandler.style.backgroundColor = this._.accessors.color(datum, 'right-handler');
		rightHandler.style.position = "absolute";
		rightHandler.style.zIndex = this._.accessors.zIndex(datum, 'right-handler');
		rightHandler.style.opacity = this._.accessors.opacity(datum, 'right-handler');
		rightHandler.style.display = (this._.accessors.visible(datum, 'right-handler'))? 'block' : 'none';

		return rightHandler;
	}

	_configure_top_handler(topHandler, datum) {
		// topHandler.dataset.hash = hash;
		topHandler.setAttribute('top-handler', true);
		topHandler.setAttribute('handler', 'top');
		topHandler.style.height = this._.accessors.width(datum, 'top-handler') + "px";
		// topHandler.style.bottom = "0px";
		topHandler.style.left = "0px";
		topHandler.style.width = "100%";
		topHandler.style.backgroundColor = this._.accessors.color(datum, 'top-handler');
		topHandler.style.position = "absolute";
		topHandler.style.zIndex = this._.accessors.zIndex(datum, 'top-handler');
		topHandler.style.opacity = this._.accessors.opacity(datum, 'top-handler');
		topHandler.style.display = (this._.accessors.visible(datum, 'top-handler'))? 'block' : 'none';

		return topHandler;
	}

	_configure_bottom_handler(bottomHandler, datum) {
		// bottomHandler.dataset.hash = hash;
		bottomHandler.setAttribute('bottom-handler', true);
		bottomHandler.setAttribute('handler', 'bottom');
		bottomHandler.style.height = this._.accessors.width(datum, 'bottom-handler') + "px";
		bottomHandler.style.bottom = "0px";
		bottomHandler.style.left = "0px";
		bottomHandler.style.width = "100%";
		bottomHandler.style.backgroundColor = this._.accessors.color(datum, 'bottom-handler');
		bottomHandler.style.position = "absolute";
		bottomHandler.style.zIndex = this._.accessors.zIndex(datum, 'bottom-handler');
		bottomHandler.style.opacity = this._.accessors.opacity(datum, 'bottom-handler');
		bottomHandler.style.display = (this._.accessors.visible(datum, 'bottom-handler'))? 'block' : 'none';

		return bottomHandler;
	}
	
	_configure_background(background, datum) {
		// background.dataset.hash = hash;
		background.style.width = '100%';
		background.style.height = '100%';
		background.style.position = 'absolute';
		background.style.backgroundColor = this._.accessors.color(datum, 'background');
		background.style.zIndex = this._.accessors.zIndex(datum, 'background');
		background.style.opacity = this._.accessors.opacity(datum, 'background');
		background.style.display = (this._.accessors.visible(datum, 'background'))? 'block' : 'none';

		return background;
	}

	set(datum, $segment) {
		$segment = super.set(datum, $segment);

		this._configure_segment($segment, datum);

		this._configure_left_handler($segment[this._.safkCustomProperty].leftHandler, datum);

		this._configure_right_handler($segment[this._.safkCustomProperty].rightHandler, datum);

		this._configure_top_handler($segment[this._.safkCustomProperty].topHandler, datum);

		this._configure_bottom_handler($segment[this._.safkCustomProperty].bottomHandler, datum);

		this._configure_background($segment[this._.safkCustomProperty].background, datum);

		return $segment;
	}

	allocate_element(datum) {
		let $segment = super.allocate_element(datum);

		$segment[this._.safkCustomProperty] = $segment[this._.safkCustomProperty] || {};

		if (!$segment[this._.safkCustomProperty].background) $segment.appendChild($segment[this._.safkCustomProperty].background = document.createElement('background'));

		if (!$segment[this._.safkCustomProperty].leftHandler) $segment.appendChild($segment[this._.safkCustomProperty].leftHandler = document.createElement('handler'));

		if (!$segment[this._.safkCustomProperty].rightHandler) $segment.appendChild($segment[this._.safkCustomProperty].rightHandler = document.createElement('handler'));

		if (!$segment[this._.safkCustomProperty].topHandler) $segment.appendChild($segment[this._.safkCustomProperty].topHandler = document.createElement('handler'));

		if (!$segment[this._.safkCustomProperty].bottomHandler) $segment.appendChild($segment[this._.safkCustomProperty].bottomHandler = document.createElement('handler'));


		return $segment;
	}
}