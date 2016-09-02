'use strict'

// import { SegmentsLayer } from 'segments-layer.js';

class WaveformSegmentsLayer extends SegmentsLayer {

	constructor(params) {
		super(params);

		this.accessor('channelData', (d, channelNumber) => {
			return undefined;
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
		this.accessor('waveformDetail', (d) => {
			return 500;
		});

		this.accessor('zIndex', (d, elementName) => { 
			/*
			 * 'right-handler' 'left-handler' 'bottom-handler' 
			 * 'top-handler' 'waveform' 'waveform-overlay' 
			 * 'header' 'segment' 'background'
			 */
			return (WaveformSegmentsLayer.zIndexDefaults[elementName] !== undefined)? 
						WaveformSegmentsLayer.zIndexDefaults[elementName] :
						((d.zIndex !== undefined)? d.zIndex : 1);
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
			var $waveform = that._.$el.querySelector("waveform[do-rendering]");

			if ($waveform) {

				$waveform.removeAttribute("do-rendering");

				// var canvas = $waveform.querySelector('canvas');
				var $image = $waveform.querySelector('img');
				var canvas = that._.canvas;
				var hash = $waveform.parentElement.getAttribute('data-hash');
				var datum = that.get_datum(hash);

				// that._render_waveform(datum, canvas, $waveform.parentElement)
				// 		.then(that._convert_canvas_to_image($image, canvas));

				that._render_waveform(
										that._.accessors.bufferStart(datum), that._.accessors.bufferEnd(datum), 
										that._.accessors.sampleRate(datum), 
										that._.accessors.channelData(datum, 0), undefined, 
										that._.accessors.color(datum, 'waveform'), that._.accessors.width(datum, 'waveform'), 
										that._.accessors.waveformDetail(datum), 
										Number($waveform.parentElement.style.height.substring(0, $waveform.parentElement.style.height.length-2)), 
										canvas
									).then((renderingResult) => {
										that._convert_canvas_to_image(canvas, $image).then(($image) => {
											WaveformSegmentsLayer.renderingController.mark_as_rendered(that, $waveform, renderingResult);
										});
									});
			}
			setTimeout(timeoutFn, 250);
		};

		setTimeout(timeoutFn, 250);
	}

	_convert_canvas_to_image($canvas, $image) {
		return new Promise((resolve, reject) => {
			var dataURL = $canvas.toDataURL();
			$image.src = dataURL;

			$image.style.pointerEvents = "none";
			$image.onselectstart = () => { return false; };
			$image.onmousedown = () => { return false; };
			$image.unselectable = "on";

			$image.style.mozUserSelect = "mozNone";
			$image.style.khtmlUserSelect = "none";
			$image.style.webkitUserSelect = "none";
			$image.style.oUserSelect = "none";
			$image.style.userSelect = "none";

			resolve($image);
		});
	}

	_render_waveform(bufferStart, bufferEnd, sampleRate, channelData0, channelData1, waveformLineColor, waveformLineWidth, waveformDetail, height, $canvas) {
		return new Promise((resolve, reject) => {
			var ctx = $canvas.getContext("2d");
			ctx.clearRect(0, 0, $canvas.width, $canvas.height);

			var il = channelData0;

			var numSamples = bufferEnd - bufferStart;
			// $canvas.width = Math.min(waveformDetail, numSamples);
			$canvas.width = waveformDetail;
			$canvas.height = height;
			var numPixels  = $canvas.width;

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

			ctx.lineWidth = waveformLineColor;
			ctx.strokeStyle = waveformLineWidth;
			ctx.stroke();

			resolve({
				bufferStart: bufferStart, 
				bufferEnd: bufferEnd, 
				sampleRate: sampleRate, 
				channelData0: channelData0, 
				waveformLineColor: waveformLineColor, 
				waveformLineWidth: waveformLineWidth, 
				waveformDetail: waveformDetail, 
				canvas: $canvas
			});
		});
	}

	_configure_header($header, datum) {
		$header.style.height = this._.accessors.width(datum, 'header') + "px";
		$header.style.left = "0px";
		$header.style.width = "100%";
		$header.style.backgroundColor = this._.accessors.color(datum, 'header');
		$header.style.position = "absolute";
		$header.style.opacity = this._.accessors.opacity(datum, 'header');
		$header.style.zIndex = this._.accessors.zIndex(datum, 'header');
		$header.style.display = (this._.accessors.visible(datum, 'header'))? 'block' : 'none';

		var $span = $header.children[0];
		if (!$span) {
			$span = document.createElement('span');
			$header.appendChild($span);
		}
		$span.style.fontFamily = this._.accessors.fontFamily(datum);
		$span.style.fontSize = this._.accessors.fontSize(datum);
		$span.style.fontColor = this._.accessors.color(datum, 'text');
		$span.style.opacity = this._.accessors.opacity(datum, 'text');
		$span.style.display = (this._.accessors.visible(datum, 'text'))? 'block' : 'none';
		$span.innerHTML = this._.accessors.text(datum);
		$span.style.pointerEvents = "none";
		$span.onselectstart = () => { return false; };
		$span.onmousedown = () => { return false; };
		$span.unselectable = "on";
		$span.style.mozUserSelect = "mozNone";
		$span.style.khtmlUserSelect = "none";
		$span.style.webkitUserSelect = "none";
		$span.style.oUserSelect = "none";
		$span.style.userSelect = "none";

		return $header;
	}

	_configure_waveform($waveform, datum) {
		var outerHTML = $waveform.parentElement;
		var $image;
		// var width = Number(outerHTML.style.width.substring(0, outerHTML.style.width.length-2));
		// var height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));

		$waveform.style.position = "absolute";
		$waveform.style.overflow = "hidden";

		if ($waveform.childElementCount === 0) {
			$image = document.createElement('img');
			
			$waveform.appendChild($image);
		} else {
			$image = $waveform.querySelector('img');
		}

		if (this._.accessors.visible(datum, 'waveform')) {

			WaveformSegmentsLayer.renderingController.request_render(this, $waveform, datum);

		}

		$image.style.position = "absolute";
		$image.style.left = "0";
		$image.style.top = "0";
		// $image.width = width;
		// $image.height = height;
		$image.style.zIndex = -1;

		$waveform.style.width = "100%";
		$waveform.style.height = "100%";
		$waveform.style.opacity = this._.accessors.opacity(datum, 'waveform');
		$waveform.style.zIndex = this._.accessors.zIndex(datum, 'waveform');
		$waveform.style.display = (this._.accessors.visible(datum, 'waveform'))? 'block' : 'none';

		return $waveform;
	}

	_configure_waveform_overlay($waveformOverlay, datum) {
		var outerHTML = $waveformOverlay.parentElement;
		var width = Number(outerHTML.style.width.substring(0, outerHTML.style.width.length-2));
		var height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));
		$waveformOverlay.style.position = "absolute";
		$waveformOverlay.style.left = "0";
		$waveformOverlay.style.top = "0";
		$waveformOverlay.style.background = "rgba(255,255,255,0)";
		$waveformOverlay.style.zIndex = this._.accessors.zIndex(datum, 'waveform-overlay');
		$waveformOverlay.style.width = "100%";
		$waveformOverlay.style.height = "100%";

		return $waveformOverlay;
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

	_remove($el, hash) {
		super._remove($el, hash);

		var $image = $el.safk.waveform.querySelector('img');

		if ($image) {
			$image.setAttribute('current-buffer-start', '');
			$image.setAttribute('current-buffer-end', '');
			$image.setAttribute('current-sample-rate', '');
			$image.setAttribute('current-waveform-line-color', '');
			$image.setAttribute('current-waveform-line-width', '');
			$image.setAttribute('current-waveform-detail', '');
			$image.setAttribute('current-time-units-per-pixel', '');
		}
	}
}

class WaveformsRenderingController {
	constructor() {}

	request_render(layer, $waveform, datum) {

		var newBufferStart 			= layer._.accessors.bufferStart(datum);
		var newBufferEnd 			= layer._.accessors.bufferEnd(datum);
		var newSampleRate 			= layer._.accessors.sampleRate(datum);
		var newLineColor 			= layer._.accessors.color(datum, 'waveform');
		var newLineWidth 			= layer._.accessors.width(datum, 'waveform');
		var newDetail 				= layer._.accessors.waveformDetail(datum);

		var $image = $waveform.querySelector('img');

		var curBufferStart 			= Number($image.getAttribute('current-buffer-start'));
		var curBufferEnd 			= Number($image.getAttribute('current-buffer-end'));
		var curSampleRate 			= Number($image.getAttribute('current-sample-rate'));
		var curLineColor 			= $image.getAttribute('current-waveform-line-color');
		var curLineWidth 			= Number($image.getAttribute('current-waveform-line-width'));
		var curDetail 				= Number($image.getAttribute('current-waveform-detail'));

		if (curBufferStart 		!== newBufferStart 	|| 
				curBufferEnd 	!== newBufferEnd 	|| 
				curSampleRate 	!== newSampleRate 	|| 
				curLineColor 	!== newLineColor 	|| 
				curLineWidth 	!== newLineWidth 	|| 
				curDetail 		!== newDetail) {

			console.log('refreshing');

			$waveform.setAttribute('do-rendering', true);

		} else {

			var outerHTML = $waveform.parentElement;
			var width = Number(outerHTML.style.width.substring(0, outerHTML.style.width.length-2));
			var height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));
			$image.width = width;
			$image.height = height;

		}
	}

	mark_as_rendered(layer, $waveform, renderingResult) {
		var $image = $waveform.querySelector('img');

		$image.setAttribute('current-buffer-start', renderingResult.bufferStart);
		$image.setAttribute('current-buffer-end', renderingResult.bufferEnd);
		$image.setAttribute('current-sample-rate', renderingResult.sampleRate);
		$image.setAttribute('current-waveform-line-color', renderingResult.waveformLineColor);
		$image.setAttribute('current-waveform-line-width', renderingResult.waveformLineWidth);
		$image.setAttribute('current-waveform-detail', renderingResult.waveformDetail);

		var outerHTML = $waveform.parentElement;
		var width = Number(outerHTML.style.width.substring(0, outerHTML.style.width.length-2));
		var height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));
		$image.width = width;
		$image.height = height;
	}
}

WaveformSegmentsLayer.renderingController = new WaveformsRenderingController();

WaveformSegmentsLayer.zIndexDefaults = {
	'background': 0, 
	'waveform': 1, 
	'waveform-overlay': 2, 
	'header': 3, 
	'right-handler': 4, 
	'left-handler': 4, 
	'top-handler': 4, 
	'bottom-handler': 4
};