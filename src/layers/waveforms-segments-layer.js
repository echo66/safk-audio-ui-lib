'use strict'

import { SegmentsLayer } from './segments-layer-v2.js';
import { WaveformsRenderingController } from '../utils/waveforms-rendering-controller.js';
import { linear } from '../utils/linear-scale.js';

export class WaveformSegmentsLayer extends SegmentsLayer {

	constructor(params) {
		super(params);

		const that = this;

		this.accessor('bufferTimeToPixel', (datum, samples, sampleRate, bufferStart, bufferCursor, bufferEnd) => {
			return (bufferCursor - bufferStart) / sampleRate;
		});
		this.accessor('channelData', (d, channelNumber) => {
			return undefined;
		});
		this.accessor('bufferStart', (d) => {
			return d.bufferStart;
		});
		this.accessor('bufferEnd', (d) => {
			return d.bufferEnd;
		});
		this.accessor('sampleRate', (d) => {
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
		this.accessor('chunkDetail', (d, chunkBufferStart, chunkBufferEnd, elementName, $chunkEl) => {
			/* 'horizontal', 'vertical' */
			/* 
			 * This accessor is used to specify the with and height 
			 * of the html canvas where the waveform chunk will be drawn.
			 */
			switch (elementName) {
				case 'horizontal': 
					var bufferStart = that._.accessors.bufferStart(d);
					var bufferEnd   = that._.accessors.bufferEnd(d);
					var $outerHTML  = $chunkEl.parentElement;
					var waveformTotalWidth = Number($outerHTML.style.width.substring(0, $outerHTML.style.width.length-2));
					return Math.round(((chunkBufferEnd - chunkBufferStart) / (bufferEnd - bufferStart)) * waveformTotalWidth);
				case 'vertical': 
					return that.height;
			}
		});
		this.accessor('allowWaveformRedraw', (d, $waveformEl) => {
			/*
			 * No redrawing or rescaling of the waveform will be allowed 
			 * if this accessor returns false.
			 */
			return true;
		});
		this.accessor('forceWaveformRedraw', (d, $waveformEl) => {
			/*
			 * If the buffer interval, sample rate, line color and line width 
			 * are still the same, the layer can avoid the waveform redraw and, 
			 * if needed, just rescale the waveform chunks. But if there is any 
			 * good reason to redraw the waveform (e.g.: a strict control to 
			 * avoid rescaling artifacts), this accessor must return true instead 
			 * of false.
			 */
			return false;
		});
		this.accessor('isHighPriorityChunkRedraw', (d, chunkBufferStart, chunkBufferEnd, $chunkEl) => {
			/*
			 * TODO
			 */
			return false;
		});
		this.accessor('needChunkRedraw', (d, chunkBufferStart, chunkBufferEnd, $chunkEl) => {
			/*
			 * If a chunk is already drawn, check if it needs to be redraw.
			 */
			return false;
		});
		this.accessor('dropChunkRedraw', (d, chunkBufferStart, chunkBufferEnd, $chunkEl) => {
			/*
			 * If a chunk is scheduled to (re)drawn, 
			 * one can cancel the drawing process by 
			 * returning false.
			 */
			if (that._.accessors.visible(d, 'segment'))
				return false;
			else 
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

	_render_waveform(datum, bufStart, bufEnd, sR, chData0, chData1, lineColor, lineWidth, $canvas, canvasWidth, canvasHeight) {
		const waveformSegmentTimeToPixel = this._.waveformSegmentTimeToPixel;
		const waveformSegmentValueToPixel = this._.waveformSegmentValueToPixel;
		const segmentBufferStart = this._.accessors.bufferStart(datum);
		const segmentBufferEnd = this._.accessors.bufferEnd(datum);
		const segmentDuration = this._.accessors.duration(datum);
		const requestedDuration = ((bufEnd - bufStart) / (segmentBufferEnd - segmentBufferStart)) * segmentDuration;
		const layer = this;

		return new Promise((resolve, reject) => {
			var ctx = $canvas.getContext("2d");
			// ctx.clearRect(0, 0, $canvas.width, $canvas.height);

			var il = chData0;

			$canvas.width = canvasWidth;
			$canvas.height = canvasHeight;
			var numPixels  = $canvas.width;

			var domain = waveformSegmentTimeToPixel.domain();
			domain[0] = 0;
			// domain[1] = segmentDuration;
			domain[1] = requestedDuration;
			waveformSegmentTimeToPixel.domain(domain);
			var range  = waveformSegmentTimeToPixel.range();
			range[0] = 0;
			range[1] = numPixels;
			waveformSegmentTimeToPixel.range(range);

			ctx.moveTo(0, waveformSegmentValueToPixel(il[bufStart - 1] || 0));
			ctx.beginPath();

			for (var bufferCursor = bufStart; bufferCursor <= bufEnd; bufferCursor++) {
				var value = il[bufferCursor] || 0;
				var segmentTime = layer._.accessors.bufferTimeToPixel(datum, il, sR, bufStart, bufferCursor, bufEnd);
				var valuePx = waveformSegmentValueToPixel(value);
				var segmentTimePx = waveformSegmentTimeToPixel(segmentTime);
				// ctx.lineTo(segmentTimePx, valuePx);
				ctx.lineTo(Math.round(segmentTimePx), Math.round(valuePx));
			}

			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = lineColor;
			ctx.stroke();

			resolve({
				bufferStart: bufStart, 
				bufferEnd: bufEnd, 
				sampleRate: sR, 
				channelData0: chData0, 
				waveformLineColor: lineColor, 
				waveformLineWidth: lineWidth, 
				waveformDetail: canvasWidth, 
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
		// var outerHTML = $waveform.parentElement;
		// var $image;

		$waveform.style.position = "absolute";
		$waveform.style.overflow = "hidden";
		$waveform.style.width = Math.round(this._.timeToPixel(this._.accessors.duration(datum))) + "px";
		$waveform.style.height = "100%";
		$waveform.style.opacity = this._.accessors.opacity(datum, 'waveform');
		$waveform.style.zIndex = this._.accessors.zIndex(datum, 'waveform');

		if (this._.accessors.visible(datum, 'waveform')) {
			WaveformSegmentsLayer.renderingController.request_waveform_render(this, $waveform, datum);
		}

		$waveform.style.display = (this._.accessors.visible(datum, 'waveform'))? 'block' : 'none';

		return $waveform;
	}

	_configure_waveform_overlay($waveformOverlay, datum) {
		// var outerHTML = $waveformOverlay.parentElement;
		// var width = Number(outerHTML.style.width.substring(0, outerHTML.style.width.length-2));
		// var height = Number(outerHTML.style.height.substring(0, outerHTML.style.height.length-2));
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

		let safk = this._.safkCustomProperty;

		this._configure_header($segment[safk].header, datum);

		this._configure_waveform($segment[safk].waveform, datum);

		this._configure_waveform_overlay($segment[safk].waveformOverlay, datum);

		return $segment;
	}

	allocate_element(datum) {
		let $segment = super.allocate_element(datum);

		let safk = this._.safkCustomProperty;

		$segment[safk] = $segment[safk] || {};

		if (!$segment[safk].header) $segment.appendChild($segment[safk].header = document.createElement('header'));

		if (!$segment[safk].waveform) $segment.appendChild($segment[safk].waveform = document.createElement('waveform'));

		if (!$segment[safk].waveformOverlay) $segment.appendChild($segment[safk].waveformOverlay = document.createElement('waveform-overlay'));

		return $segment;
	}

	_remove($el, hash) {
		super._remove($el, hash);

		let safk = this._.safkCustomProperty;

		var $image = $el[safk].waveform.querySelector('img');

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