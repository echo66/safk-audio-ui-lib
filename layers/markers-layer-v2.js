'use strict'

// import { Layer } from 'layer.js';

class MarkersLayer extends Layer {

	constructor(params) {
		super({
			height: params.height || 100, 
			width: params.width || 500, 
			defaultIterator: undefined, 
			timeDomain: params.timeDomain || [0, 20], 
			valueDomain: params.valueDomain || [0, 1], 
			layerTagName: 'layer', 
			layerElementTagName: 'marker', 
			layerElementDatumHashAttribute: 'data-hash'
		});

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
				return (d.visible !== undefined)? d.visible : true; 
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
		stick.style.display = (this._.accessors.visible(datum, 'stick'))? 'inline' : 'none';

		return stick;
	}

	_configure_handler(handler, datum) {
		handler.style.width = this._.accessors.width(datum, 'handler') + "px";
		handler.style.height = this._.accessors.height(datum, 'handler') + "px";
		handler.style.top = '0px';
		handler.style.position = 'absolute';
		handler.style.backgroundColor = this._.accessors.color(datum, 'handler');
		handler.style.opacity = this._.accessors.opacity(datum, 'handler');
		handler.style.display = (this._.accessors.visible(datum, 'handler'))? 'inline' : 'none';

		return handler;
	}

	_configure_marker(marker, datum) {
		marker.style.position = "absolute";
		marker.style.left = this._.timeToPixel(this._.accessors.time(datum)) + "px";
		marker.style.bottom = "0px";
		marker.style.height = "100%";
		marker.style.zIndex = this._.accessors.zIndex(datum, 'marker');
		marker.style.opacity = this._.accessors.opacity(datum, 'marker');
		marker.style.display = (this._.accessors.visible(datum, 'marker'))? 'inline' : 'none';

		return marker;
	}

	_configure_content(content, marker, datum) {
		content.style.position = "absolute";
		content.innerHTML = "";
		let innerHTML = this._.accessors.innerHTML(datum, marker);
		if (innerHTML instanceof Node)
			content.appendChild(innerHTML);
		content.style.opacity = this._.accessors.opacity(datum, 'content');
		content.style.display = (this._.accessors.visible(datum, 'content'))? 'inline' : 'none';

		return content;
	}

	set(datum) {
		let hash = this.get_hash(datum);
		var marker, handler, stick, content;
		
		marker = this.get_element(hash);

		if (marker) {

			content = segment.querySelector('content');
			stick = segment.querySelector('stick');
			handler = segment.querySelector('handler');

		} else if (marker = this._.unusedDomElsList.pop()) {

			content = segment.querySelector('content');
			stick = segment.querySelector('stick');
			handler = segment.querySelector('handler');

			// this._.$el.appendChild(marker);

			this.associate_element_to(marker, hash);

		} else {
			marker = document.createElement('marker');
			content = document.createElement('content');
			stick = document.createElement('stick');
			handler = document.createElement('handler');

			marker.appendChild(content);
			marker.appendChild(stick);
			marker.appendChild(handler);

			this._.$el.appendChild(marker);

			this.associate_element_to(marker, hash);
		}

		this._configure_marker(marker, datum);

		this._configure_stick(stick, datum);

		this._configure_handler(handler, datum);

		this._configure_content(content, marker, datum);

		return marker;
	}

	/*
	 *	Associate a DOM (or, in specific cases, the rendered object) to a datum hash.
	 */
	associate_element_to($el, hash) {
		$el.setAttribute('data-hash', hash);
		$el.datum = this.get_datum(hash);	
	}

	/*
	 * Return the DOM (or, in specific cases, the rendered object) associated with the datum hash.
	 */
	get_element(hash) {
		return this._.$el.querySelector('marker[data-hash="'+hash+'"]');
	}

	/*
	 * Remove the DOM (or, in specific cases, the rendered object) associated with the datum hash.
	 */
	unassociate_element_to($el, hash) {
		$el.removeAttribute('data-hash');
		delete $el.datum;
	}

}