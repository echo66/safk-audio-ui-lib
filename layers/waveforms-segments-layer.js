'use strict'

// import { SegmentsLayer } from 'segments-layer.js';

class WaveformSegmentsLayer extends SegmentsLayer {

	constructor(params) {
		super(params);

		this.accessor('channelData', (d, channelNumber) => {
			return new Float32Array(0);
		});
		this.accessor('bufferStart', (d, channelNumber) => {
			return d.bufferStart;
		});
		this.accessor('bufferEnd', (d, channelNumber) => {
			return d.bufferEnd;
		});
		this.accessor('sampleRate', (d, channelNumber) => {
			return d.sampleRate;
		});
		this.accessor('refresh', (d) => {
			return false;
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
			 * 'top-handler' 'waveform' 'waveform-overlay' 
			 * 'header' 'segment'
			 */
			switch (elementName) {
				case 'waveform': return 0;
				case 'waveform-overlay': return 1;
				case 'header': return 2;
				case 'right-handler':
				case 'left-handler':
				case 'top-handler':
				case 'bottom-handler': return 3;

				default: return 1;
			}
			return (d.zIndex !== undefined)? d.zIndex : 1;
		});

		this._.waveformValueToPixel = linear().domain([-1, 1]).range([0, this.height]);

		this._.onchange = (property, newValue) => {
			if (property === 'height') {
				let range = this._.waveformValueToPixel.range();
				range[1] = newValue;
			}
		};

		this._.canvas = document.createElement('canvas');

		const that = this;

		let timeoutFn = () => {
			var waveform = that._.$el.querySelector("waveform[do-rendering]");
			if (waveform) {
				// var canvas = waveform.querySelector('canvas');
				var image = waveform.querySelector('img');
				var canvas = this._.canvas;
				var hash = waveform.parentElement.getAttribute('data-hash');
				var datum = that.get_datum(hash);
				that._render_waveform(datum, canvas, waveform.parentElement)
						.then(that._convert_canvas_to_image(image, canvas));
				waveform.removeAttribute("do-rendering");
			}
			setTimeout(timeoutFn, 250);
		};

		setTimeout(timeoutFn, 250);
	}

	_convert_canvas_to_image(image, canvas) {
		var dataURL = canvas.toDataURL();
		image.src = dataURL;
		image.style.pointerEvents = "none";
		image.onselectstart = () => { return false; };
		image.onmousedown = () => { return false; };
		image.unselectable = "on";
		image.style.mozUserSelect = "mozNone";
		image.style.khtmlUserSelect = "none";
		image.style.webkitUserSelect = "none";
		image.style.oUserSelect = "none";
		image.style.userSelect = "none";
		return image;
	}

	_render_waveform(datum, canvas, outerHTML) {
		return new Promise((resolve, reject) => {
			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			var bufferStart = this._.accessors.bufferStart(datum, 0);
			var bufferEnd = this._.accessors.bufferEnd(datum, 0);

			var il = this._.accessors.channelData(datum, 0);

			var numSamples = bufferEnd - bufferStart;
			canvas.width = Math.min(this._.accessors.waveformMaxDetail(datum), numSamples);
			canvas.height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));
			var numPixels  = canvas.width;

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

			resolve();
		});
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
		span.onselectstart = () => { return false; };
		span.onmousedown = () => { return false; };
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
		var image, canvas;
		var refresh = (waveform.childElementCount === 0) || this._.accessors.refresh(datum);
		var width = Number(outerHTML.style.width.substring(0, outerHTML.style.width.length-2));
		var height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));

		if (waveform.childElementCount === 0) {
			image = document.createElement('img');
			
			waveform.appendChild(image);
		} else {
			image = waveform.querySelector('img');
		}

		if (refresh) {
			waveform.setAttribute('do-rendering', true);
		}

		image.style.position = "absolute";
		image.style.left = "0";
		image.style.top = "0";
		image.width = width;
		image.height = height;
		image.style.zIndex = -1;

		waveform.style.width = "100%";
		waveform.style.height = "100%";
		waveform.style.opacity = this._.accessors.opacity(datum, 'waveform');
		waveform.style.zIndex = this._.accessors.zIndex(datum, 'waveform');
		waveform.style.display = (this._.accessors.visible(datum, 'waveform'))? 'block' : 'none';

		return waveform;
	}

	_configure_waveform_overlay(waveformOverlay, datum) {
		var outerHTML = waveformOverlay.parentElement;
		var width = Number(outerHTML.style.width.substring(0, outerHTML.style.width.length-2));
		var height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));
		waveformOverlay.style.position = "absolute";
		waveformOverlay.style.left = "0";
		waveformOverlay.style.top = "0";
		waveformOverlay.style.background = "rgba(255,255,255,0)";
		waveformOverlay.style.zIndex = this._.accessors.zIndex(datum, 'waveform-overlay');
		waveformOverlay.style.width = width + "px";
		waveformOverlay.style.height = height + "px";

		return waveformOverlay;
	}

	set(datum, $segment) {
		$segment = super.set(datum, $segment);

		this._configure_header($segment.safk.header, datum);

		this._configure_waveform($segment.safk.waveform, datum);

		this._configure_waveform_overlay($segment.safk.waveformOverlay, datum);

		return $segment;
	}

	allocate_element(datum) {
		let $segment = super.allocate_element(datum);

		$segment.safk = $segment.safk || {};

		if (!$segment.safk.header) $segment.appendChild($segment.safk.header = document.createElement('header'));

		if (!$segment.safk.waveform) $segment.appendChild($segment.safk.waveform = document.createElement('waveform'));

		if (!$segment.safk.waveformOverlay) $segment.appendChild($segment.safk.waveformOverlay = document.createElement('waveform-overlay'));


		return $segment;
	}
}