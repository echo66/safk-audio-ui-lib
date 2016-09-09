'use strict'

import { List } from './list.js';

export class WaveformsRenderingController {

	constructor(params = {}) {

		this.queue = new List();
		this._maxBufferIntervalPerImage = params.maxBufferIntervalPerImage || 20000;
		this.safkCustomProperty = params.safkCustomProperty || 'safk';

		const renderingController = this;

		let timeoutFn = () => {
			
			var safk = renderingController.safkCustomProperty;

			while (true) {

				var $image = this._get_next_scheduled();

				if (!$image) 
					break;

				var $waveform = $image.parentElement;
				var $segment = $waveform.parentElement;
				var layer = $segment[safk].layer;

				var hash = $segment[safk].datumHash;
				var datum = layer.get_datum(hash);
				var bufferStart = $image[safk].currentBufferStart;
				var bufferEnd = $image[safk].currentBufferEnd;
				
				if (layer._.accessors.dropChunkRedraw(datum, bufferStart, bufferEnd, $image)) {
					continue;
				}

				var sampleRate = $image[safk].currentSampleRate;
				var channelData0 = layer._.accessors.channelData(datum, 0);
				var lineColor = $image[safk].currentWaveformLineColor;
				var lineWidth = $image[safk].currentWaveformLineWidth;
				var canvasWidth  = $image[safk].currentWaveformWDetail;
				var canvasHeight = $image[safk].currentWaveformHDetail;
				var canvas = layer._.canvas;

				var ctx = canvas.getContext("2d");
				ctx.clearRect(0, 0, canvas.width, canvas.height);

				layer._render_waveform(
										datum, 
										bufferStart,  bufferEnd, sampleRate, 
										channelData0, undefined, 
										lineColor, lineWidth, 
										canvas, canvasWidth, canvasHeight
									).then((renderingResult) => {

										layer._convert_canvas_to_image(canvas, $image).then(($image) => {
											// console.log($image);
										});

									});
				break;

			}

			requestAnimationFrame(timeoutFn);
		};

		requestAnimationFrame(timeoutFn);
	}

	get maxBufferIntervalPerImage() {
		return this._maxBufferIntervalPerImage;
	}

	set maxBufferIntervalPerImage(v) {
		this._maxBufferIntervalPerImage = v;
		// TODO 
	}

	_get_next_scheduled() {
		return this.queue.pop();
	}

	fit_waveform_images_list($waveform, scale, height, width, imagesList) {
		var safk = this.safkCustomProperty;
		var domain = scale.domain();
		var range = scale.range();
		domain[0] = $waveform[safk].currentBufferStart;
		domain[1] = $waveform[safk].currentBufferEnd;
		range[0] = 0;
		range[1] = width;

		scale.domain(domain).range(range);

		$waveform.style.display = "none";

		var lastImage, lastLeft, lastWidth;
		var it = imagesList.iterator();
		var entry = it.next();
		while (!entry.done) {
			var $image = entry.value;
			var chunkBufferStart = $image[safk].currentBufferStart;
			var chunkBufferEnd	 = $image[safk].currentBufferEnd;
			var width = Math.round(scale(chunkBufferEnd) - scale(chunkBufferStart));
			var left  = Math.round(scale(chunkBufferStart));
			// var left = (lastLeft + lastWidth) || Math.round(scale(chunkBufferStart));

			this.fit_waveform_image($image, left, width, height);

			lastLeft = left;
			lastWidth = width;
			lastImage = $image;

			entry = it.next();
		}

		// if (lastLeft + lastWidth !== range[1]) {
		// 	lastImage.width = range[1] - lastLeft;
		// }

		$waveform.style.display = "block";
	}

	fit_waveform_image($image, left, width, height) {
		var safk = this.safkCustomProperty;
		if ($image[safk].unused) {
			$image.style.display = "none";
		} else {
			$image.style.position = "absolute";
			$image.style.left = left + 'px';
			$image.width = width;
			$image.height = height;
			$image.style.display = "block";
		}
	}

	request_waveform_render(layer, $waveform, datum) {

		var safk = this.safkCustomProperty;

		var newBufferStart 			= layer._.accessors.bufferStart(datum);
		var newBufferEnd 			= layer._.accessors.bufferEnd(datum);
		var newSampleRate 			= layer._.accessors.sampleRate(datum);
		var newLineColor 			= layer._.accessors.color(datum, 'waveform');
		var newLineWidth 			= layer._.accessors.width(datum, 'waveform');

		$waveform[safk] 			= $waveform[safk] || {
															activeChunksList: new List(), 
															unusedChunksList: new List(), 
															auxChunksList   : new List()
														};


		var curBufferStart 			= $waveform[safk].currentBufferStart;
		var curBufferEnd 			= $waveform[safk].currentBufferEnd;
		var curSampleRate 			= $waveform[safk].currentSampleRate;
		var curLineColor 			= $waveform[safk].currentWaveformLineColor;
		var curLineWidth 			= $waveform[safk].currentWaveformLineWidth;

		if (layer._.accessors.allowWaveformRedraw(datum, $waveform)) {
			if ((curBufferStart !== newBufferStart 	|| 
				 curBufferEnd 	!== newBufferEnd 	|| 
				 curSampleRate 	!== newSampleRate 	|| 
				 curLineColor 	!== newLineColor 	|| 
				 curLineWidth 	!== newLineWidth) || layer._.accessors.forceWaveformRedraw(datum, $waveform)) {

				if (curBufferStart !== undefined && curBufferEnd !== undefined) {
					this.__clean_both_ends($waveform, curBufferStart, curBufferEnd);
				}
				// this.__clean_both_ends($waveform, newBufferStart, newBufferEnd);
				// this.__clean_both_ends($waveform, curBufferStart, curBufferEnd);
				// while ($waveform[safk].activeChunksList.size) {
				// 	var $chunkEl = $waveform[safk].activeChunksList.remove_first();
				// 	this.__unnallocate_waveform_chunk_element($waveform, $chunkEl);
				// }

				$waveform[safk].currentBufferStart = newBufferStart;
				$waveform[safk].currentBufferEnd = newBufferEnd;
				$waveform[safk].currentSampleRate = newSampleRate;
				$waveform[safk].currentWaveformLineColor = newLineColor;
				$waveform[safk].currentWaveformLineWidth = newLineWidth;

				if ($waveform[safk].activeChunksList.size === 0) {
					console.log('fresh start');
					this.__fill_with_new_chunks($waveform, datum, layer, newBufferStart, newBufferEnd, this._maxBufferIntervalPerImage, newSampleRate, newLineColor, newLineWidth);
				} else {
					console.log('adapt what we have and add to both ends')
					// (1) check for redraw of the existing chunks.
					this.__redraw_existing_chunks($waveform, datum, newSampleRate, layer, newLineColor, newLineWidth, this._maxBufferIntervalPerImage);
					
					// (2) add chunks to the left.
					this.__fill_left_with_chunks($waveform, datum, newSampleRate, layer, newLineColor, newLineWidth, this._maxBufferIntervalPerImage);

					// (3) add chunks to thr right.
					this.__fill_right_with_chunks($waveform, datum, newSampleRate, layer, newLineColor, newLineWidth, this._maxBufferIntervalPerImage);
				}

			} 
		}

		var $segment = $waveform.parentElement;
		var width = Math.ceil(Number($segment.style.width.substring(0, $segment.style.width.length-2)));
		var height = (Number($segment.style.height.substring(0, $segment.style.height.length-2)));
		var imagesList = $waveform[safk].activeChunksList;
		this.fit_waveform_images_list($waveform, layer._.waveformSegmentTimeToPixel, height, width, imagesList);
	}

	add_layer(layer) {
		// N/A
	}

	remove_layer(layer) {
		// N/A
	}

	is_scheduled_for_rendering($el) {
		return this.queue.has($el);
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
	}













	// NEW STUFF

	__configure_waveform_chunk_props($chunkEl, bufStart, bufEnd, sR, lColor, lWidth, cWidth, cHeight) {
		// var $waveform = $chunkEl.parentElement;
		// var $segment  = $waveform.parentElement;
		var safk = this.safkCustomProperty;
		// var layer = $segment[safk].layer;
		// var hash = $segment[safk].datumHash;

		$chunkEl[safk] = $chunkEl[safk] || {};
		$chunkEl[safk].currentBufferStart 			= bufStart;
		$chunkEl[safk].currentBufferEnd	 			= bufEnd;
		$chunkEl[safk].currentSampleRate 			= sR;
		$chunkEl[safk].currentWaveformLineColor 	= lColor;
		$chunkEl[safk].currentWaveformLineWidth 	= lWidth;
		$chunkEl[safk].currentWaveformWDetail 		= cWidth;
		$chunkEl[safk].currentWaveformHDetail		= cHeight;

		return $chunkEl;
	}


	__unnallocate_waveform_chunk_element($waveform, $chunkEl) {
		var safk = this.safkCustomProperty;
		var unusedChunksList = $waveform[safk].unusedChunksList;
		var activeChunksList = $waveform[safk].activeChunksList;
		$chunkEl.setAttribute('unused', true);
		$chunkEl.src = "";
		$chunkEl[safk].unused = true;
		$chunkEl.style.display = 'none';
		activeChunksList.remove($chunkEl);
		unusedChunksList.push($chunkEl);
		return $chunkEl;
	}

	__allocate_waveform_chunk_element($waveform) {
		var safk = this.safkCustomProperty;
		var unusedChunksList = $waveform[safk].unusedChunksList;
		var activeChunksList = $waveform[safk].activeChunksList;
		var $chunkEl = unusedChunksList.pop() || document.createElement('img');
		$chunkEl[safk] = $chunkEl[safk] || {};
		$chunkEl.setAttribute('unused', false);
		$chunkEl[safk].unused = false;
		$chunkEl.style.display = 'none';
		activeChunksList.push($chunkEl);
		(!$chunkEl.parentElement) && $waveform.appendChild($chunkEl);
		return $chunkEl;
	}

	__clean_both_ends($waveform, newBufferStart, newBufferEnd) {
		var safk = this.safkCustomProperty;
		var activeChunksList = $waveform[safk].activeChunksList;
		var $chunkEl;

		$chunkEl = activeChunksList.first;
		while($chunkEl && $chunkEl[safk].currentBufferStart < newBufferStart) {
			$chunkEl = activeChunksList.remove_first();
			this.__unnallocate_waveform_chunk_element($aveform, $chunkEl);
			$chunkEl = activeChunksList.first;
			// console.log('remove at left');
		}

		$chunkEl = activeChunksList.last;
		while($chunkEl && $chunkEl[safk].currentBufferEnd > newBufferEnd) {
			$chunkEl = activeChunksList.remove_last();
			this.__unnallocate_waveform_chunk_element($waveform, $chunkEl);
			$chunkEl = activeChunksList.last;
			// console.log('remove at right');
		}
	}

	__fill_with_new_chunks($waveform, datum, layer, bufferStart, bufferEnd, bufferCursorHopSize, sampleRate, lineColor, lineWidth) {
		// var safk = this.safkCustomProperty;
		var chunkBufferStart = bufferStart;
		var chunkBufferEnd;

		// var waveformTotalWidth = Number($waveform.style.width.substring(0, $waveform.style.width.length-2));

		while (chunkBufferStart <= bufferEnd) {
			chunkBufferEnd = Math.min(chunkBufferStart + bufferCursorHopSize, bufferEnd);

			var $chunkEl = this.__allocate_waveform_chunk_element($waveform);

			var cWidth  = layer._.accessors.chunkDetail(datum, chunkBufferStart, chunkBufferEnd, 'horizontal', $chunkEl);
			var cHeight = layer._.accessors.chunkDetail(datum, chunkBufferStart, chunkBufferEnd, 'vertical',   $chunkEl);

			this.__configure_waveform_chunk_props($chunkEl, chunkBufferStart, chunkBufferEnd, sampleRate, lineColor, lineWidth, cWidth, cHeight);

			var isHighPriorityChunkRedraw = layer._.accessors.isHighPriorityChunkRedraw(datum, chunkBufferStart, chunkBufferEnd, $chunkEl);
			this.schedule_for_render($chunkEl, isHighPriorityChunkRedraw);

			chunkBufferStart += bufferCursorHopSize + 1;
		}
	}

	__redraw_existing_chunks($waveform, datum, sampleRate, layer, lineColor, lineWidth, bufferCursorHopSize) {
		var safk = this.safkCustomProperty;
		var activeChunksList = $waveform[safk].activeChunksList;
		var it = activeChunksList.iterator();
		var entry = it.next();
		var $chunkEl;

		while (!entry.done) {
			$chunkEl = entry.value

			var chunkBufferStart = $chunkEl[safk].currentBufferStart;
			var chunkBufferEnd = $chunkEl[safk].currentBufferEnd;

			var needRedraw = (bufferCursorHopSize !== (chunkBufferEnd - chunkBufferStart)) || 
								layer._.accessors.needChunkRedraw(datum, chunkBufferStart, chunkBufferEnd, $chunkEl);

			chunkBufferEnd = chunkBufferStart + bufferCursorHopSize;

			if (needRedraw) {

				var cWidth  = layer._.accessors.chunkDetail(datum, chunkBufferStart, chunkBufferEnd, 'horizontal', $chunkEl);
				var cHeight = layer._.accessors.chunkDetail(datum, chunkBufferStart, chunkBufferEnd, 'vertical',   $chunkEl);

				this.__configure_waveform_chunk_props($chunkEl, chunkBufferStart, chunkBufferEnd, sampleRate, lineColor, lineWidth, cWidth, cHeight);

				var isHighPriorityChunkRedraw = layer._.accessors.isHighPriorityChunkRedraw(datum, chunkBufferStart, chunkBufferEnd);
				this.schedule_for_render($chunkEl, isHighPriorityChunkRedraw);
			}

			entry = it.next();
		}
	}

	__fill_left_with_chunks($waveform, datum, sampleRate, layer, lineColor, lineWidth, bufferCursorHopSize) {
		var safk = this.safkCustomProperty;
		var activeChunksList = $waveform[safk].activeChunksList;
		var auxList = $waveform[safk].activeChunksList;
		$waveform[safk].activeChunksList = $waveform[safk].auxChunksList;
		var chunkBufferStart, chunkBufferEnd;

		var chunkBufferStart = layer._.accessors.bufferStart(datum);

		var bufferEnd = activeChunksList.first[safk].currentBufferStart - 1;

		while (chunkBufferStart < bufferEnd) {
			chunkBufferEnd = Math.min(chunkBufferStart + bufferCursorHopSize, bufferEnd);

			var $chunkEl = this.__allocate_waveform_chunk_element($waveform);

			var cWidth  = layer._.accessors.chunkDetail(datum, chunkBufferStart, chunkBufferEnd, 'horizontal', $chunkEl);
			var cHeight = layer._.accessors.chunkDetail(datum, chunkBufferStart, chunkBufferEnd, 'vertical',   $chunkEl);

			this.__configure_waveform_chunk_props($chunkEl, chunkBufferStart, chunkBufferEnd, sampleRate, lineColor, lineWidth, cWidth, cHeight);

			var isHighPriorityChunkRedraw = layer._.accessors.isHighPriorityChunkRedraw(datum, chunkBufferStart, chunkBufferEnd);
			this.schedule_for_render($chunkEl, isHighPriorityChunkRedraw);

			chunkBufferStart += bufferCursorHopSize + 1;

		}

		$waveform[safk].auxChunksList    = $waveform[safk].activeChunksList;
		$waveform[safk].activeChunksList = auxList;
	}

	__fill_right_with_chunks($waveform, datum, sampleRate, layer, lineColor, lineWidth, bufferCursorHopSize) {
		var safk = this.safkCustomProperty;
		var activeChunksList = $waveform[safk].activeChunksList;
		var chunkBufferStart, chunkBufferEnd;

		var chunkBufferStart = activeChunksList.last[safk].currentBufferEnd + 1;

		var bufferEnd = layer._.accessors.bufferEnd(datum);

		while (chunkBufferStart <= bufferEnd) {
			chunkBufferEnd = Math.min(chunkBufferStart + bufferCursorHopSize, bufferEnd);

			var $chunkEl = this.__allocate_waveform_chunk_element($waveform);

			var cWidth  = layer._.accessors.chunkDetail(datum, chunkBufferStart, chunkBufferEnd, 'horizontal', $chunkEl);
			var cHeight = layer._.accessors.chunkDetail(datum, chunkBufferStart, chunkBufferEnd, 'vertical',   $chunkEl);

			this.__configure_waveform_chunk_props($chunkEl, chunkBufferStart, chunkBufferEnd, sampleRate, lineColor, lineWidth, cWidth, cHeight);

			var isHighPriorityChunkRedraw = layer._.accessors.isHighPriorityChunkRedraw(datum, chunkBufferStart, chunkBufferEnd);
			this.schedule_for_render($chunkEl, isHighPriorityChunkRedraw);

			chunkBufferStart += bufferCursorHopSize + 1;

		}
	}




	

}