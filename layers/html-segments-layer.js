'use strict'

// import { SegmentsLayer } from 'segments-layer.js';

class HTMLSegmentsLayer extends SegmentsLayer {
	
	constructor(params) {
		super(params);

		this.accessor('innerHTML', (d, outerHTML) => { 
			/*
			 */
			return d.innerHTML;
		});
	}

	_configure_content(content, segment, datum) {
		content.style.position = "absolute";
		content.innerHTML = "";
		let innerHTML = this._.accessors.innerHTML(datum, segment);
		if (innerHTML instanceof Node)
			content.appendChild(innerHTML);
		content.style.opacity = this._.accessors.opacity(datum, 'content');
		content.style.display = (this._.accessors.visible(datum, 'content'))? 'block' : 'none';

		return content;
	}

	set(datum, $segment) {
		$segment = super.set(datum, $segment);

		this._configure_content($segment.safk.content, $segment, datum);

		return $segment;
	}

	allocate_element(datum) {
		let $segment = super.allocate_element(datum);

		$segment.safk = $segment.safk || {};

		if (!$segment.safk.content) $segment.appendChild($segment.safk.content = document.createElement('content'));


		return $segment;
	}

}