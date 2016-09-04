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
		this.accessor('allowWaveformRedraw', (d) => {
			return true;
		});
		this.accessor('isHighPriorityRedraw', (d) => {
			return false;
		});
		this.accessor('needBufferIntervalRedraw', (d, bufferStart, bufferEnd) => {
			return false;
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

	_render_waveform(datum, bufferStart, bufferEnd, sampleRate, channelData0, channelData1, waveformLineColor, waveformLineWidth, width, height, $canvas) {
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
			// $canvas.width = Math.min(waveformDetail, 5000);
			$canvas.width = width;
			$canvas.height = height;
			var numPixels  = $canvas.width;

			// var pixelStep = numPixels / numSamples;

			var domain = waveformSegmentTimeToPixel.domain();
			domain[0] = 0;
			domain[1] = segmentDuration;
			waveformSegmentTimeToPixel.domain(domain);
			var range  = waveformSegmentTimeToPixel.range();
			range[0] = 0;
			range[1] = numPixels;
			waveformSegmentTimeToPixel.range(range);

			ctx.moveTo(0, waveformSegmentValueToPixel(il[bufferStart-1] || 0));
			ctx.beginPath();

			for (var bufferCursor = bufferStart; bufferCursor <= bufferEnd; bufferCursor++) {
				var value = il[bufferCursor] || 0;
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
				waveformDetail: width, 
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

		// if ($waveform.childElementCount === 0) {
		// 	$image = document.createElement('img');
		// 	$canvas = document.createElement('canvas');
			
		// 	$waveform.appendChild($image);
		// 	$waveform.appendChild($canvas);
		// } else {
		// 	$image = $waveform.querySelector('img');
		// }

		if (this._.accessors.visible(datum, 'waveform')) {

			WaveformSegmentsLayer.renderingController.request_render(this, $waveform, datum);

		}

		// $image.style.position = "absolute";
		// $image.style.left = "0";
		// $image.style.top = "0";
		// // $image.width = width;
		// // $image.height = height;
		// $image.style.zIndex = -1;

		// $waveform.style.width = "100%";
		$waveform.style.width = this._.timeToPixel(this._.accessors.duration(datum)) + "px";
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

		this._configure_header($segment[this._.safkCustomProperty].header, datum);

		this._configure_waveform($segment[this._.safkCustomProperty].waveform, datum);

		this._configure_waveform_overlay($segment[this._.safkCustomProperty].waveformOverlay, datum);

		return $segment;
	}

	allocate_element(datum) {
		let $segment = super.allocate_element(datum);

		$segment.safk = $segment.safk || {};

		if (!$segment[this._.safkCustomProperty].header) $segment.appendChild($segment[this._.safkCustomProperty].header = document.createElement('header'));

		if (!$segment[this._.safkCustomProperty].waveform) $segment.appendChild($segment[this._.safkCustomProperty].waveform = document.createElement('waveform'));

		if (!$segment[this._.safkCustomProperty].waveformOverlay) $segment.appendChild($segment[this._.safkCustomProperty].waveformOverlay = document.createElement('waveform-overlay'));

		$segment[this._.safkCustomProperty].waveform[this._.safkCustomProperty] = $segment[this._.safkCustomProperty].waveform[this._.safkCustomProperty] || {};

		$segment[this._.safkCustomProperty].waveform[this._.safkCustomProperty].layer = this;

		$segment[this._.safkCustomProperty].waveform[this._.safkCustomProperty].remainingChuncksToRender = 0;

		return $segment;
	}

	_remove($el, hash) {
		super._remove($el, hash);

		var $image = $el[this._.safkCustomProperty].waveform.querySelector('img');

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
	constructor(params = {}) {

		// this.controlledLayers = [];
		// this.index = 0;

		this.queue = new List();
		this.maxBufferIntervalPerImage = params.maxBufferIntervalPerImage || 44100;
		this.safkCustomProperty = params.safkCustomProperty || 'safk';

		const renderingController = this;

		let timeoutFn = () => {
			var $image = this._get_next_scheduled();

			if ($image) {
				var layer = $image[renderingController.safkCustomProperty].layer;
				var $waveform = $image.parentElement;
				var $segment = $waveform.parentElement;

				var canvas = layer._.canvas;
				var hash = $image[renderingController.safkCustomProperty].datumHash;
				var datum = layer.get_datum(hash);

				layer._render_waveform(
										datum, 
										$image[renderingController.safkCustomProperty].currentBufferStart, 
										$image[renderingController.safkCustomProperty].currentBufferEnd, 
										$image[renderingController.safkCustomProperty].currentSampleRate, 
										layer._.accessors.channelData(datum, 0), 
										undefined, 
										$image[renderingController.safkCustomProperty].currentWaveformLineColor, 
										$image[renderingController.safkCustomProperty].currentWaveformLineWidth, 
										Math.min($image[renderingController.safkCustomProperty].currentWaveformDetail, 5000), 
										Number($segment.style.height.substring(0, $segment.style.height.length-2)), 
										canvas
									).then((renderingResult) => {
										layer._convert_canvas_to_image(canvas, $image).then(($image) => {
											// renderingController._fit_waveform_image($image);
											$waveform[renderingController.safkCustomProperty].remainingChuncksToRender--;
											if ($waveform[renderingController.safkCustomProperty].remainingChuncksToRender === 0) {
												// renderingController.mark_as_rendered(layer, $waveform, renderingResult);
											}
										});
									});
			}

			// setTimeout(timeoutFn, 250);
			requestAnimationFrame(timeoutFn);
		};

		// setTimeout(timeoutFn, 250);
		requestAnimationFrame(timeoutFn);
	}

	_get_next_scheduled() {
		// var layer = this._get_a_layer();
		// return layer.layerDomEl.querySelector("waveform[do-rendering]");
		return this.queue.pop();
	}

	// _get_a_layer() {
	// 	if (this.controlledLayers.length === 0) {
	// 		return undefined;
	// 	}

	// 	if (this.index >= this.controlledLayers.length) {
	// 		this.index = 0;
	// 	}

	// 	return this.controlledLayers[this.index++];
	// }

	/*
	 TODO: refactor '_fit_waveform_images_list' and '_fit_waveform_image'!!!
	 */
	_fit_waveform_images_list($waveform) {
		var layer = $waveform[this.safkCustomProperty].layer;
		var scale = layer._.waveformSegmentTimeToPixel;
		var domain = scale.domain();
		var range = scale.range();
		var $segment = $waveform.parentElement;
		domain[0] = $waveform[this.safkCustomProperty].currentBufferStart;
		domain[1] = $waveform[this.safkCustomProperty].currentBufferEnd;
		range[0] = 0;
		range[1] = Number($segment.style.width.substring(0, $segment.style.width.length-2));

		scale.domain(domain).range(range);

		var height =  Number($segment.style.height.substring(0, $segment.style.height.length-2));

		$waveform.style.display = "none";

		var it = $waveform[this.safkCustomProperty].imagesList.iterator();
		var entry = it.next();
		while (!entry.done) {
			var $image = entry.value;
			if ($image[this.safkCustomProperty].unused) {
				$image.style.display = "none";
			} else {
				var bufferStart = $image[this.safkCustomProperty].currentBufferStart;
				var bufferInterval = $image[this.safkCustomProperty].currentBufferEnd - $image[this.safkCustomProperty].currentBufferStart;
				// $image.style.display = "none";
				$image.style.position = "absolute";
				$image.style.left = scale(bufferStart) + 'px';
				// $image.width = scale(bufferInterval);
				$image.width = range[1];
				$image.height = height;
				$image.style.display = "block";
			}
			entry = it.next();
		}

		$waveform.style.display = "block";
	}

	_fit_waveform_image($image) {
		var layer = $image[this.safkCustomProperty].layer;
		var scale = layer._.waveformSegmentTimeToPixel;
		var domain = scale.domain();
		var range = scale.range();
		var $waveform = $image.parentElement;
		var $segment = $waveform.parentElement;
		domain[0] = $image[this.safkCustomProperty].currentBufferStart;
		domain[1] = $image[this.safkCustomProperty].currentBufferEnd;
		range[0] = 0;
		range[1] = Number($segment.style.width.substring(0, $segment.style.width.length-2));

		scale.domain(domain).range(range);

		var height =  Number($segment.style.height.substring(0, $segment.style.height.length-2));

		var bufferStart = $image[this.safkCustomProperty].currentBufferStart;
		var bufferInterval = $image[this.safkCustomProperty].currentBufferEnd - $image[this.safkCustomProperty].currentBufferStart;
		// $image.style.display = "none";
		$image.style.position = "absolute";
		$image.style.left = scale(bufferStart) + 'px';
		// $image.width = scale(bufferInterval);
		$image.width = range[1];
		$image.height = height;
		$image.style.display = "block";
	}

	request_render(layer, $waveform, datum) {

		var $image = $waveform.querySelector('img');

		if (!layer._.accessors.allowWaveformRedraw(datum)) return;

		var newBufferStart 			= layer._.accessors.bufferStart(datum);
		var newBufferEnd 			= layer._.accessors.bufferEnd(datum);
		var newSampleRate 			= layer._.accessors.sampleRate(datum);
		var newLineColor 			= layer._.accessors.color(datum, 'waveform');
		var newLineWidth 			= layer._.accessors.width(datum, 'waveform');
		var newDetail 				= layer._.accessors.waveformDetail(datum, $waveform);

		var curBufferStart 			= $waveform[this.safkCustomProperty].currentBufferStart;
		var curBufferEnd 			= $waveform[this.safkCustomProperty].currentBufferEnd;
		var curSampleRate 			= $waveform[this.safkCustomProperty].currentSampleRate;
		var curLineColor 			= $waveform[this.safkCustomProperty].currentWaveformLineColor;
		var curLineWidth 			= $waveform[this.safkCustomProperty].currentWaveformLineWidth;
		var curDetail 				= $waveform[this.safkCustomProperty].currentWaveformDetail;

		if ((curBufferStart 		!== newBufferStart 	|| 
					curBufferEnd 	!== newBufferEnd 	|| 
					curSampleRate 	!== newSampleRate 	|| 
					curLineColor 	!== newLineColor 	|| 
					curLineWidth 	!== newLineWidth 	|| 
					curDetail 		!== newDetail) && !this.is_scheduled_for_rendering($waveform)) {

			$waveform[this.safkCustomProperty].currentBufferStart 		= newBufferStart;
			$waveform[this.safkCustomProperty].currentBufferEnd 		= newBufferEnd;
			$waveform[this.safkCustomProperty].currentSampleRate 		= newSampleRate;
			$waveform[this.safkCustomProperty].currentWaveformLineColor = newLineColor;
			$waveform[this.safkCustomProperty].currentWaveformLineWidth = newLineWidth;
			$waveform[this.safkCustomProperty].currentWaveformDetail 	= newDetail;

			$waveform[this.safkCustomProperty].imagesList = $waveform[this.safkCustomProperty].imagesList || new List();

			var bufferInterval = newBufferEnd - newBufferStart;

			var requiredNumberOfImages = Math.ceil(bufferInterval / (this.maxBufferIntervalPerImage || bufferInterval));

			var bufferIntervalPerImage = bufferInterval / requiredNumberOfImages;

			var previousStart = newBufferStart;

			while ($waveform[this.safkCustomProperty].imagesList.size < requiredNumberOfImages) {
				var $image = document.createElement('img');
				$image.setAttribute('unused', true);
				$image.style.display = "none";
				$image[this.safkCustomProperty] = {};
				$waveform.appendChild($image);
				$waveform[this.safkCustomProperty].imagesList.push($image);
			}

			var it = $waveform[this.safkCustomProperty].imagesList.iterator();
			var entry = it.next();
			var i = 0;
			var hash = layer.get_hash(datum);
			while (!entry.done) {
				var $image = entry.value;
				var __ = $image[this.safkCustomProperty];
				var bufferStart = Math.round(newBufferStart + i * bufferIntervalPerImage);
				var bufferEnd = Math.round(newBufferStart + (i + 1) * bufferIntervalPerImage);
				var needRedraw = __.currentBufferStart 			!== bufferStart 	|| 
								 __.currentBufferEnd 			!== bufferEnd 		|| 
								 __.currentSampleRate 			!== newSampleRate	|| 
								 __.currentWaveformLineColor 	!== newLineColor 	|| 
								 __.currentWaveformLineWidth 	!== newLineWidth 	|| 
								 __.currentWaveformDetail 		!== newDetail 		|| 
								 __.datumHash 					!== hash;

				needRedraw = needRedraw || layer._.accessors.needBufferIntervalRedraw(datum, bufferStart, bufferEnd);


				__.currentBufferStart = Math.round(newBufferStart + i * bufferIntervalPerImage);
				__.currentBufferEnd =  Math.round(newBufferStart + (i + 1) * bufferIntervalPerImage);
				__.currentSampleRate 		= newSampleRate;
				__.currentWaveformLineColor = newLineColor;
				__.currentWaveformLineWidth = newLineWidth;
				__.currentWaveformDetail 	= newDetail;
				__.datumHash = layer.get_hash(datum);
				__.layer = layer;

				__.unused = false;
				$image.setAttribute('unused', false);

				$image.style.display = "none";

				if (needRedraw && this.schedule_for_render($image, layer._.accessors.isHighPriorityRedraw(datum))) {
					$image.src = "";
					$waveform[this.safkCustomProperty].remainingChuncksToRender++;
				}

				entry = it.next();
				i++;

				if (i === requiredNumberOfImages)
					break;
			}

			while (i < $waveform[this.safkCustomProperty].imagesList.size) {
				var $image = entry.value;
				$image[this.safkCustomProperty].unused = true;
				$image.setAttribute('unused', true);
				$image.style.display = "none";
				entry = it.next();
				i++;
			}

			// return;

		} 

		this._fit_waveform_images_list($waveform);
	}

	mark_as_rendered(layer, $waveform, renderingResult) {

		// $waveform[this.safkCustomProperty].currentBufferStart 		= renderingResult.bufferStart;
		// $waveform[this.safkCustomProperty].currentBufferEnd 		= renderingResult.bufferEnd;
		// $waveform[this.safkCustomProperty].currentSampleRate 		= renderingResult.sampleRate;
		// $waveform[this.safkCustomProperty].currentWaveformLineColor = renderingResult.waveformLineColor;
		// $waveform[this.safkCustomProperty].currentWaveformLineWidth = renderingResult.waveformLineWidth;
		// $waveform[this.safkCustomProperty].currentWaveformDetail 	= renderingResult.waveformDetail;

		this._fit_waveform_images_list($waveform);
	}

	add_layer(layer) {
		// for (var i=0; i<this.controlledLayers.length; i++) {
		// 	if (this.controlledLayers[i] === layer) 
		// 		return;
		// }
		// this.controlledLayers.push(layer);
	}

	remove_layer(layer) {
		// for (var i=0; i<this.controlledLayers.length; i++) {
		// 	if (this.controlledLayers[i] === layer) {
		// 		this.controlledLayers.slice(i, 1);
		// 		return;
		// 	}
		// }
	}

	is_scheduled_for_rendering($el) {
		return this.queue.has($el);
		// return $el.getAttribute('do-rendering') === 'true';
	}

	schedule_for_render($el, isHighPriorityRender) {
		if (!this.is_scheduled_for_rendering($el)) {
			if (isHighPriorityRender) {
				this.queue.insert_as_first($el);
			} else 
				this.queue.insert_as_last($el);
			return true;
		}
		return false;
		// $el.setAttribute('do-rendering', true);
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