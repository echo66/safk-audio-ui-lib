'use strict'

import { SegmentsLayer } from './segments-layer.js';

class MultiDimensionalSegmentsLayer extends SegmentsLayer {

	constructor(params) {
		super(params);

		this.accessor('frameTime', (d) => {
			// TODO
		});
		this.accessor('frameDuration', (d) => {
			// TODO
		});
		this.accessor('frameDimensions', (d) => {
			// TODO
		});
		this.accessor('frameDimValue', (d, index) => {
			// TODO
		});
		this.accessor('frameDimColor', (d, index) => {
			// TODO
		});
		this.accessor('frameDimHeight', (d, index, outerHTML) => {
			// TODO
		});
		
	}

	_configure_header(datum, $header) {
		// TODO
	}

	_configure_multi_dimensional_content(datum, $content) {
		// TODO
	}

	set(datum, $segment) {
		$segment = super.set(datum, $segment);

		this._configure_header($segment.safk.header, datum);

		this._configure_multi_dimensional_content($segment.safk.content, datum);

		return $segment;
	}
}

export { MultiDimensionalSegmentsLayer };