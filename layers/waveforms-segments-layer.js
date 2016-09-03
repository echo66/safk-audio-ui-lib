'use strict'

// import { SegmentsLayer } from 'segments-layer.js';

class WaveformSegmentsLayer extends SegmentsLayer {

	constructor(params) {
		super(params);

		this.accessor('bufferTimeToPixel', (datum, samples, sampleRate, bufferStart, bufferCursor, bufferEnd) => {
			return (bufferCursor - bufferStart) / sampleRate;
		});
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
		this.accessor('waveformDetail', (d, $waveform) => {
			return 500;
		});
		this.accessor('allowWaveformReDraw', (d) => {
			return true;
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

		this._.waveformSegmentValueToPixel = linear().domain([-1, 1]).range([0, this.height]);
		this._.waveformSegmentTimeToPixel = linear().domain([0, 1]).range([0, 1]);;

		this._.onchange = (property, newValue) => {
			if (property === 'height') {
				let range = this._.waveformSegmentValueToPixel.range();
				range[1] = newValue;
			}
		};

		this._.canvas = document.createElement('canvas');

		WaveformSegmentsLayer.renderingController.add_layer(this);
	}

	destroy() {
		super.destroy();

		WaveformSegmentsLayer.renderingController.remove_layer(this);
	}

	_convert_canvas_to_image($canvas, $image) {
		return new Promise((resolve, reject) => {
			var dataURL = $canvas.toDataURL('image/png');
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

	_render_waveform(datum, bufferStart, bufferEnd, sampleRate, channelData0, channelData1, waveformLineColor, waveformLineWidth, waveformDetail, height, $canvas) {
		const waveformSegmentTimeToPixel = this._.waveformSegmentTimeToPixel;
		const waveformSegmentValueToPixel = this._.waveformSegmentValueToPixel;
		const segmentDuration = this._.accessors.duration(datum);
		const layer = this;

		return new Promise((resolve, reject) => {
			var ctx = $canvas.getContext("2d");
			ctx.clearRect(0, 0, $canvas.width, $canvas.height);

			var il = channelData0;

			var numSamples = bufferEnd - bufferStart;
			// $canvas.width = Math.min(waveformDetail, numSamples);
			$canvas.width = Math.min(waveformDetail, 5000);
			$canvas.height = height;
			var numPixels  = $canvas.width;

			var pixelStep = numPixels / numSamples;

			ctx.moveTo(0, 0);
			ctx.beginPath();

			var domain = waveformSegmentTimeToPixel.domain();
			domain[1] = segmentDuration;
			waveformSegmentTimeToPixel.domain(domain);
			var range  = waveformSegmentTimeToPixel.range();
			range[1] = numPixels;
			waveformSegmentTimeToPixel.range(range);

			for (var bufferCursor = bufferStart; bufferCursor <= bufferEnd; bufferCursor++) {
				var value = il[bufferCursor];
				var segmentTime = layer._.accessors.bufferTimeToPixel(datum, il, sampleRate, bufferStart, bufferCursor, bufferEnd);
				var valuePx = waveformSegmentValueToPixel(value);
				var segmentTimePx = waveformSegmentTimeToPixel(segmentTime);
				ctx.lineTo(segmentTimePx, valuePx);
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
			$image.setAttribute('waveform-drawn', '');
		}
	}
}

class WaveformsRenderingController {
	constructor() {
		this.controlledLayers = [];
		this.index = 0;

		const renderingController = this;

		let timeoutFn = () => {
			var layer = renderingController._get_a_layer();

			if (layer) {
				var $waveform = layer.layerDomEl.querySelector("waveform[do-rendering]");

				if ($waveform) {

					$waveform.removeAttribute("do-rendering");

					var $image = $waveform.querySelector('img');
					var canvas = layer._.canvas;
					var hash = $waveform.parentElement.getAttribute('data-hash');
					var datum = layer.get_datum(hash);

					layer._render_waveform(
											datum, 
											layer._.accessors.bufferStart(datum), layer._.accessors.bufferEnd(datum), 
											layer._.accessors.sampleRate(datum), 
											layer._.accessors.channelData(datum, 0), undefined, 
											layer._.accessors.color(datum, 'waveform'), layer._.accessors.width(datum, 'waveform'), 
											layer._.accessors.waveformDetail(datum, $waveform), 
											Number($waveform.parentElement.style.height.substring(0, $waveform.parentElement.style.height.length-2)), 
											canvas
										).then((renderingResult) => {
											layer._convert_canvas_to_image(canvas, $image).then(($image) => {
												WaveformSegmentsLayer.renderingController.mark_as_rendered(layer, $waveform, renderingResult);
											});
										});
				}
			}

			setTimeout(timeoutFn, 250);
		};

		setTimeout(timeoutFn, 250);
	}

	_get_a_layer() {
		if (this.controlledLayers.length === 0) {
			return undefined;
		}

		if (this.index >= this.controlledLayers.length) {
			this.index = 0;
		}

		return this.controlledLayers[this.index++];
	}

	request_render(layer, $waveform, datum) {

		var $image = $waveform.querySelector('img');

		var waveformDrawn 			= $image.getAttribute('waveform-drawn');

		if (!layer._.accessors.allowWaveformReDraw(datum)) return;

		var newBufferStart 			= layer._.accessors.bufferStart(datum);
		var newBufferEnd 			= layer._.accessors.bufferEnd(datum);
		var newSampleRate 			= layer._.accessors.sampleRate(datum);
		var newLineColor 			= layer._.accessors.color(datum, 'waveform');
		var newLineWidth 			= layer._.accessors.width(datum, 'waveform');
		var newDetail 				= layer._.accessors.waveformDetail(datum, $waveform);

		var curBufferStart 			= Number($image.getAttribute('current-buffer-start'));
		var curBufferEnd 			= Number($image.getAttribute('current-buffer-end'));
		var curSampleRate 			= Number($image.getAttribute('current-sample-rate'));
		var curLineColor 			= $image.getAttribute('current-waveform-line-color');
		var curLineWidth 			= Number($image.getAttribute('current-waveform-line-width'));
		var curDetail 				= Number($image.getAttribute('current-waveform-detail'));

		if ((curBufferStart 		!== newBufferStart 	|| 
					curBufferEnd 	!== newBufferEnd 	|| 
					curSampleRate 	!== newSampleRate 	|| 
					curLineColor 	!== newLineColor 	|| 
					curLineWidth 	!== newLineWidth 	|| 
					curDetail 		!== newDetail) && !this.is_scheduled_for_rendering($waveform)) {

			this.schedule_for_render($waveform);

			return;

		} 

		var outerHTML = $waveform.parentElement;
		var width = Number(outerHTML.style.width.substring(0, outerHTML.style.width.length-2));
		var height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));
		$image.width = width;
		$image.height = height;
	}

	mark_as_rendered(layer, $waveform, renderingResult) {
		var $image = $waveform.querySelector('img');

		$image.setAttribute('current-buffer-start', renderingResult.bufferStart);
		$image.setAttribute('current-buffer-end', renderingResult.bufferEnd);
		$image.setAttribute('current-sample-rate', renderingResult.sampleRate);
		$image.setAttribute('current-waveform-line-color', renderingResult.waveformLineColor);
		$image.setAttribute('current-waveform-line-width', renderingResult.waveformLineWidth);
		$image.setAttribute('current-waveform-detail', renderingResult.waveformDetail);
		$image.setAttribute('waveform-drawn', 'true');

		var outerHTML = $waveform.parentElement;
		var width = Number(outerHTML.style.width.substring(0, outerHTML.style.width.length-2));
		var height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));
		$image.width = width;
		$image.height = height;
	}

	add_layer(layer) {
		for (var i=0; i<this.controlledLayers.length; i++) {
			if (this.controlledLayers[i] === layer) 
				return;
		}
		this.controlledLayers.push(layer);
	}

	remove_layer(layer) {
		for (var i=0; i<this.controlledLayers.length; i++) {
			if (this.controlledLayers[i] === layer) {
				this.controlledLayers.slice(i, 1);
				return;
			}
		}
	}

	is_scheduled_for_rendering($waveform) {
		return $waveform.getAttribute('do-rendering') === 'true';
	}

	schedule_for_render($waveform) {
		$waveform.setAttribute('do-rendering', true);
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