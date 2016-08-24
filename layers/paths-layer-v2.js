'use strict'

// import { Layer } from 'layer.js';

class PathsLayer extends Layer {

	constructor(params) {
		super({
			height: params.height || 100, 
			width: params.width || 500, 
			defaultIterator: undefined, 
			timeDomain: params.timeDomain || [0, 20], 
			valueDomain: params.valueDomain || [0, 1], 
			layerTagName: 'layer', 
			layerElementTagName: 'path', 
			layerElementDatumHashAttribute: 'data-hash'
		});

		this.accessor('time', (d) => {
			return d.time;
		});
		this.accessor('value', (d) => {
			return d.value;
		});
		this.accessor('color', (d) => {
			return d.color || 'green';
		});
		this.accessor('width', (d) => {
			return d.width || 1;
		});

		this._.pathsSVG = document.createElementNS("http://www.w3.org/2000/svg", 'svg');

		this._.$el.appendChild(this._.pathsSVG);

		this._.pathsSVG.setAttributeNS(null, 'width', '100%');
		this._.pathsSVG.setAttributeNS(null, 'height', '100%');
		this._.pathsSVG.style.position = "absolute";
		this._.pathsSVG.style.zIndex = 1;
		this._.pathsSVG.style.transform = "scale(1,-1)";

	}

	set(datum) {
		let hash = this.get_hash(datum);
		var path, d = "";
		
		path = this.get_element(hash);

		if (path) {

			// N/A

		} else if (path = this._.unusedDomElsList.pop()) {

			this.associate_element_to(path, hash);

		} else {

			path = document.createElementNS("http://www.w3.org/2000/svg", 'path');

			this._.pathsSVG.appendChild(path);

			this.associate_element_to(path, hash);

		}

		path.setAttributeNS(null, 'stroke', this._.accessors.color(datum));
		path.setAttributeNS(null, 'stroke-width', this._.accessors.width(datum));
		path.setAttributeNS(null, 'fill', 'none');

		datum.start();
		let entry = datum.next();
		let x, y;
		if (!entry.done) {
			x = this._.timeToPixel(this._.accessors.time(entry.value));
			y = this._.valueToPixel(this._.accessors.value(entry.value));
			d += ("M" + x + " " + y + " ");
			entry = datum.next();
			while (!entry.done) {
				x = this._.timeToPixel(this._.accessors.time(entry.value));
				y = this._.valueToPixel(this._.accessors.value(entry.value));
				d += ("L" + x + " " + y + " ");
				entry = datum.next();
			}
			d += "";
		}
		datum.stop();

		path.setAttributeNS(null, 'd', d);

		return path;
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
		return this._.pathsSVG.querySelector('path[data-hash="' + hash + '"]');
	}

	/*
	 * Remove the DOM (or, in specific cases, the rendered object) associated with the datum hash.
	 */
	unassociate_element_to($el, hash) {
		$el.removeAttribute('data-hash');
		delete $el.datum;
	}

}