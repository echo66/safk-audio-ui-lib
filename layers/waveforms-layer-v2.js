'use strict'

// import { Layer } from 'layer.js';

class WaveformsLayer extends Layer {

	constructor(params) {
		super({
			height: params.height || 100, 
			width: params.width || 500, 
			defaultIterator: undefined, 
			timeDomain: params.timeDomain || [0, 20], 
			valueDomain: params.valueDomain || [-1, 1], 
			layerTagName: 'layer', 
			layerElementTagName: 'waveform-segment', 
			layerElementDatumHashAttribute: 'data-hash'
		});

		this.accessor('time', (d) => { 
			return d.time; 
		});
		this.accessor('duration', (d) => { 
			return d.duration;
		});
		this.accessor('channelData', (d, channelNumber) => {
			return new Float32Array(0);
		});
		this.accessor('bufferStart', (d, channelNumber) => {
			return d.bufferStart;
		});
		this.accessor('bufferEnd', (d, channelNumber) => {
			return d.bufferEnd;
		});
		this.accessor('refresh', (d) => {
			return false;
		});
		this.accessor('color', (d, elementName) => {
			/*
			 * 'right-handler' 'left-handler' 'bottom-handler' 
			 * 'top-handler' 'segment' 'waveform' 'text' 
			 * 'header'
			 */
			if (elementName === 'segment')
				return "rgb(255,255,255)";
			else
				return 'cyan';
		});
		this.accessor('width', (d, elementName) => {
			/*
			 * 'right-handler' 'left-handler' 'bottom-handler' 
			 * 'top-handler' 'waveform' 
			 */
			return undefined;
		});
		this.accessor('text', (d) => { 
			return '';
		});
		this.accessor('textOffset', (d, axis) => { 
			/* 'x' 'y' */
			return 0;
		});
		this.accessor('fontFamily', (d) => { 
			return 'Verdana';
		});
		this.accessor('fontSize', (d) => { 
			return 5;
		});
		this.accessor('waveformMaxDetail', (d) => {
			return 500;
		});

		this.accessor('zIndex', (d, elementName) => { 
			/*
			 * 'right-handler' 'left-handler' 'bottom-handler' 
			 * 'top-handler' 'waveform' 'text' 
			 * 'header' 'segment'
			 */
			return (d.zIndex !== undefined)? d.zIndex : 1;
		});
		this.accessor('opacity', (d, elementName) => { 
			/*
			 * 'right-handler' 'left-handler' 'bottom-handler' 
			 * 'top-handler' 'waveform' 'text' 
			 * 'header' 'segment'
			 */
			return (d.opacity !== undefined)? d.opacity : 1;
		});
		this.accessor('visible', (d, elementName) => { 
			/*
			 * 'right-handler' 'left-handler' 'bottom-handler' 
			 * 'top-handler' 'waveform' 'text' 
			 * 'header' 'segment'
			 */
			return (d.visible !== undefined)? d.visible : true; 
		});

		this._.waveformValueToPixel = linear().domain([-1, 1]).range([0, this.height]);

		this._.onchange = (property, newValue) => {
			if (property === 'height') {
				let range = this._.waveformValueToPixel.range();
				range[1] = newValue;
			}
		};

		this._.canvas = document.createElement('canvas');
	}

	_convert_canvas_to_image(image) {
		var dataURL = this._.canvas.toDataURL();
		// var image = document.createElement('img');
		image.src = dataURL;
		image.style.pointerEvents = "none";
		image.onselectstart="return false;" 
		image.onmousedown="return false;"
		image.unselectable = "on";
		image.style.mozUserSelect = "mozNone";
		image.style.khtmlUserSelect = "none";
		image.style.webkitUserSelect = "none";
		image.style.oUserSelect = "none";
		image.style.userSelect = "none";
		return image;
	}

	_render_waveform(datum, outerHTML) {
		var ctx = this._.canvas.getContext("2d");
		ctx.clearRect(0, 0, this._.canvas.width, this._.canvas.height);

		var bufferStart = this._.accessors.bufferStart(datum, 0);
		var bufferEnd = this._.accessors.bufferEnd(datum, 0);

		var il = this._.accessors.channelData(datum, 0);

		var numSamples = bufferEnd - bufferStart;
		this._.canvas.width = Math.min(this._.accessors.waveformMaxDetail(datum), numSamples);
		this._.canvas.height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));
		var numPixels  = this._.canvas.width;

		var pixelStep = numPixels / numSamples;

		ctx.moveTo(0, 0);
		ctx.beginPath();

		var px = 0;

		for (var i = bufferStart; i <= bufferEnd; i++) {
			var valAm = il[i]
			var valPx = l1._.waveformValueToPixel(valAm);
			ctx.lineTo(px, valPx);
			px += pixelStep;
		}

		ctx.lineWidth = this._.accessors.width(datum, 'waveform');
		ctx.strokeStyle = this._.accessors.color(datum, 'waveform');
		ctx.stroke();
	}

	_configure_segment(segment, datum) {
		segment.removeAttribute('unused');
		segment.style.position = "absolute";
		segment.style.overflow = "hidden";
		segment.style.width = this._.timeToPixel(this._.accessors.duration(datum) + this._.timeDomain[0]) + "px";
		segment.style.left = this._.timeToPixel(this._.accessors.time(datum)) + "px";
		segment.style.bottom = "0px"
		segment.style.height = segment.parentElement.style.height;
		segment.style.zIndex = this._.accessors.zIndex(datum, 'segment');
		segment.style.opacity = this._.accessors.opacity(datum, 'segment');
		segment.style.display = (this._.accessors.visible(datum, 'segment'))? 'block' : 'none';
		segment.style.zIndex = this._.accessors.zIndex(datum, 'segment');
		segment.style.backgroundColor = this._.accessors.color(datum, 'segment');

		return segment;
	}

	_configure_left_handler(leftHandler, datum) {
		leftHandler.setAttribute('left-handler', true);
		leftHandler.style.height = "100%";
		leftHandler.style.bottom = "0px";
		leftHandler.style.left = "0px";
		leftHandler.style.width = this._.accessors.width(datum, 'left-handler') + "px";
		leftHandler.style.backgroundColor = this._.accessors.color(datum, 'left-handler');
		leftHandler.style.position = "absolute";
		leftHandler.style.opacity = this._.accessors.opacity(datum, 'left-handler');
		leftHandler.style.zIndex = this._.accessors.zIndex(datum, 'left-handler');
		leftHandler.style.display = (this._.accessors.visible(datum, 'left-handler'))? 'block' : 'none';

		return leftHandler;
	}

	_configure_right_handler(rightHandler, datum) {
		rightHandler.setAttribute('right-handler', true);
		rightHandler.style.height = "100%";
		rightHandler.style.bottom = "0px";
		rightHandler.style.left = (this._.timeToPixel(this._.accessors.duration(datum) + this._.timeDomain[0]) - this._.accessors.width(datum, 'right-handler')) + "px";
		rightHandler.style.width = this._.accessors.width(datum, 'right-handler') + "px";
		rightHandler.style.backgroundColor = this._.accessors.color(datum, 'right-handler');
		rightHandler.style.position = "absolute";
		rightHandler.style.opacity = this._.accessors.opacity(datum, 'right-handler');
		rightHandler.style.zIndex = this._.accessors.zIndex(datum, 'right-handler');
		rightHandler.style.display = (this._.accessors.visible(datum, 'right-handler'))? 'block' : 'none';

		return rightHandler;
	}

	_configure_top_handler(topHandler, datum) {
		topHandler.setAttribute('top-handler', true);
		topHandler.style.height = this._.accessors.width(datum, 'top-handler') + "px";
		topHandler.style.left = "0px";
		topHandler.style.width = "100%";
		topHandler.style.backgroundColor = this._.accessors.color(datum, 'top-handler');
		topHandler.style.position = "absolute";
		topHandler.style.opacity = this._.accessors.opacity(datum, 'top-handler');
		topHandler.style.zIndex = this._.accessors.zIndex(datum, 'top-handler');
		topHandler.style.display = (this._.accessors.visible(datum, 'top-handler'))? 'block' : 'none';

		return topHandler;
	}

	_configure_bottom_handler(bottomHandler, datum) {
		bottomHandler.setAttribute('bottom-handler', true);
		bottomHandler.style.height = this._.accessors.width(datum, 'bottom-handler') + "px";
		bottomHandler.style.bottom = "0px";
		bottomHandler.style.left = "0px";
		bottomHandler.style.width = "100%";
		bottomHandler.style.backgroundColor = this._.accessors.color(datum, 'bottom-handler');
		bottomHandler.style.position = "absolute";
		bottomHandler.style.opacity = this._.accessors.opacity(datum, 'bottom-handler');
		bottomHandler.style.zIndex = this._.accessors.zIndex(datum, 'bottom-handler');
		bottomHandler.style.display = (this._.accessors.visible(datum, 'bottom-handler'))? 'block' : 'none';

		return bottomHandler;
	}

	_configure_header(header, datum) {
		header.style.height = this._.accessors.width(datum, 'header') + "px";
		header.style.left = "0px";
		header.style.width = "100%";
		header.style.backgroundColor = this._.accessors.color(datum, 'header');
		header.style.position = "absolute";
		header.style.opacity = this._.accessors.opacity(datum, 'header');
		header.style.zIndex = this._.accessors.zIndex(datum, 'header');
		header.style.display = (this._.accessors.visible(datum, 'header'))? 'block' : 'none';

		var span = header.children[0];
		if (!span) {
			span = document.createElement('span');
			header.appendChild(span);
		}
		span.style.fontFamily = this._.accessors.fontFamily(datum);
		span.style.fontSize = this._.accessors.fontSize(datum);
		span.style.fontColor = this._.accessors.color(datum, 'text');
		span.style.opacity = this._.accessors.opacity(datum, 'text');
		span.style.display = (this._.accessors.visible(datum, 'text'))? 'block' : 'none';
		span.innerHTML = this._.accessors.text(datum);
		span.style.pointerEvents = "none";
		span.onselectstart="return false;" 
		span.onmousedown="return false;"
		span.unselectable = "on";
		span.style.mozUserSelect = "mozNone";
		span.style.khtmlUserSelect = "none";
		span.style.webkitUserSelect = "none";
		span.style.oUserSelect = "none";
		span.style.userSelect = "none";

		return header;
	}

	_configure_waveform(waveform, datum) {
		waveform.style.position = "absolute";
		var outerHTML = waveform.parentElement;
		var overlay, image;
		var refresh = (waveform.childElementCount === 0) || this._.accessors.refresh(datum);
		var width = Number(outerHTML.style.width.substring(0, outerHTML.style.width.length-2));
		var height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2))

		if (waveform.childElementCount === 0) {
			overlay = document.createElement('div');
			image = document.createElement('img');
			
			waveform.appendChild(overlay);
			waveform.appendChild(image);
		} else {
			overlay = waveform.querySelector('div');
			image = waveform.querySelector('img');
		}

		if (refresh) {
			this._render_waveform(datum, outerHTML);

			this._convert_canvas_to_image(image);
		}

		overlay.style.position = "absolute";
		overlay.style.left = "0";
		overlay.style.top = "0";
		overlay.style.background = "rgba(255,255,255,0)";
		overlay.style.zIndex = 2;
		overlay.style.width = width + "px";
		overlay.style.height = height + "px";

		image.width = width;
		image.height = height;
		image.style.zIndex = 1;

		waveform.style.width = "100%";
		waveform.style.height = "100%";
		waveform.style.opacity = this._.accessors.opacity(datum, 'waveform');
		waveform.style.zIndex = this._.accessors.zIndex(datum, 'waveform');
		waveform.style.display = (this._.accessors.visible(datum, 'waveform'))? 'block' : 'none';

		return waveform;
	}

	set(datum, $segment) {
		$segment = super.set(datum, $segment);

		this._configure_segment($segment, datum);

		this._configure_left_handler($segment.safk.leftHandler, datum);

		this._configure_right_handler($segment.safk.rightHandler, datum);

		this._configure_top_handler($segment.safk.topHandler, datum);

		this._configure_bottom_handler($segment.safk.bottomHandler, datum);

		this._configure_header($segment.safk.header, datum);

		this._configure_waveform($segment.safk.waveform, datum);

		return $segment;
	}

	allocate_element(datum) {
		let $segment = super.allocate_element(datum);

		$segment.safk = $segment.safk || {};

		if (!$segment.safk.header) $segment.appendChild($segment.safk.header = document.createElement('header'));

		if (!$segment.safk.waveform) $segment.appendChild($segment.safk.waveform = document.createElement('waveform'));

		if (!$segment.safk.leftHandler) $segment.appendChild($segment.safk.leftHandler = document.createElement('handler'));

		if (!$segment.safk.rightHandler) $segment.appendChild($segment.safk.rightHandler = document.createElement('handler'));

		if (!$segment.safk.topHandler) $segment.appendChild($segment.safk.topHandler = document.createElement('handler'));

		if (!$segment.safk.bottomHandler) $segment.appendChild($segment.safk.bottomHandler = document.createElement('handler'));


		return $segment;
	}
}