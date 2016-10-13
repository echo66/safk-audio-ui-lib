'use strict'

import { Layer } from './layer.js';

class MarkersLayer extends Layer {

	constructor(params) {
		super({
			height: params.height || 100, 
			width: params.width || 500, 
			defaultIterator: undefined, 
			timeDomain: params.timeDomain || [0, 20], 
			valueDomain: params.valueDomain || [0, 1], 
			layerTagName: params.layerTagName || 'layer', 
			layerElementTagName: params.layerElementTagName || 'marker', 
			layerElementDatumHashAttribute: params.layerElementDatumHashAttribute || 'data-hash'
		});

		// const that = this;

		this._.contentTagName = params.contentTagName = 'content';
		this._.stickTagName = params.stickTagName || 'stick';
		this._.handlerTagName = params.handlerTagName || 'handler';

		// DEFINE ACCESSORS
		{
			this.accessor('time', (d) => { 
				return d.time; 
			});
			this.accessor('color', (d, elementName) => { 
				/*
				 * 'stick' 'handler' 
				 */
				switch (elementName) {
					case 'stick': return (d.stickColor !== undefined)? d.color : 'cyan';
					case 'handler': return (d.handlerColor !== undefined)? d.color : 'blue';
				}
			});
			this.accessor('width', (d, elementName) => { 
				/*
				 * 'stick' 'handler' 
				 */
				switch (elementName) {
					case 'stick': return 2;
					case 'handler': return 4;
				}
			});
			this.accessor('height', (d, elementName) => { 
				/*
				 * 'handler' 
				 */
				return 4;
			});
			this.accessor('zIndex', (d, elementName) => { 
				/*
				 * 'stick' 'handler' 'marker' 'content' 
				 */
				return (d.zIndex !== undefined)? d.zIndex : 1;
			});
			this.accessor('opacity', (d, elementName) => { 
				/*
				 * 'stick' 'handler' 'marker' 'content' 
				 */
				return (d.opacity !== undefined)? d.opacity : 1;
			});
			this.accessor('visible', (d, elementName) => { 
				/*
				 * 'stick' 'handler' 'marker' 'content' 
				 */

				return true;
				
				// return (d.visible !== undefined)? d.visible : true; 

				// var time = that._.accessors.time(d);
				// if (time > this.timeDomain[1])
				// 	return false;
				// else 
				// 	return true;
			});
			this.accessor('innerHTML', (d, outerHTML) => { 
				return d.innerHTML;
			});
		}

	}

	_configure_stick(stick, datum) {
		stick.style.width = this._.accessors.width(datum, 'stick') + "px";
		stick.style.height = "100%";
		stick.style.position = 'absolute';
		stick.style.backgroundColor = this._.accessors.color(datum, 'stick');
		stick.style.opacity = this._.accessors.opacity(datum, 'stick');
		stick.style.display = (this._.accessors.visible(datum, 'stick'))? 'block' : 'none';

		return stick;
	}

	_configure_handler(handler, datum) {
		handler.style.width = this._.accessors.width(datum, 'handler') + "px";
		handler.style.height = this._.accessors.height(datum, 'handler') + "px";
		handler.style.top = '0px';
		handler.style.position = 'absolute';
		handler.style.backgroundColor = this._.accessors.color(datum, 'handler');
		handler.style.opacity = this._.accessors.opacity(datum, 'handler');
		handler.style.display = (this._.accessors.visible(datum, 'handler'))? 'block' : 'none';

		return handler;
	}

	_configure_marker(marker, datum) {
		marker.style.position = "absolute";
		marker.style.left = this._.timeToPixel(this._.accessors.time(datum)) + "px";
		marker.style.bottom = "0px";
		marker.style.height = "100%";
		marker.style.zIndex = this._.accessors.zIndex(datum, 'marker');
		marker.style.opacity = this._.accessors.opacity(datum, 'marker');
		marker.style.display = (this._.accessors.visible(datum, 'marker'))? 'block' : 'none';

		return marker;
	}

	_configure_content(content, marker, datum) {
		content.style.position = "absolute";
		content.innerHTML = "";
		let innerHTML = this._.accessors.innerHTML(datum, marker);
		if (innerHTML instanceof Node) {
			let child = content.childNodes[0];
			if (child && innerHTML !== child) {
				content.replaceChild(innerHTML, child);
			} else {
				content.appendChild(innerHTML);
			}
		}
		content.style.opacity = this._.accessors.opacity(datum, 'content');
		content.style.display = (this._.accessors.visible(datum, 'content'))? 'block' : 'none';

		return content;
	}

	set(datum, $marker) {
		$marker = super.set(datum, $marker);

		this._configure_marker($marker, datum);

		this._configure_stick($marker.safk.stick, datum);

		this._configure_handler($marker.safk.handler, datum);

		this._configure_content($marker.safk.content, $marker, datum);

		return $marker;
	}

	allocate_element(datum) {
		let $marker = super.allocate_element(datum);

		$marker.safk = $marker.safk || {};

		if (!$marker.safk.content) $marker.appendChild($marker.safk.content = document.createElement(this._.contentTagName));
		
		if (!$marker.safk.stick) $marker.appendChild($marker.safk.stick = document.createElement(this._.stickTagName));
		
		if (!$marker.safk.handler) $marker.appendChild($marker.safk.handler = document.createElement(this._.handlerTagName));

		return $marker;
	}

}

export { MarkersLayer };