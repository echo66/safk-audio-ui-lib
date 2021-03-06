'use strict'

import { Layer } from './layer.js';

class PathsLayer extends Layer {

	constructor(params) {
		super({
			height: params.height || 100, 
			width: params.width || 500, 
			defaultIterator: undefined, 
			timeDomain: params.timeDomain || [0, 20], 
			valueDomain: params.valueDomain || [0, 1], 
			layerTagName: params.layerTagName || 'layer', 
			layerElementTagName: params.layerElementTagName || 'path', 
			layerElementDatumHashAttribute: params.layerElementDatumHashAttribute || 'data-hash'
		});

		this._.$pathsSVG = document.createElementNS("http://www.w3.org/2000/svg", 'svg');

		this._.layerElementsParent = this._.$pathsSVG;

		this._.$el.children[0].appendChild(this._.$pathsSVG);

		this._.$pathsSVG.setAttributeNS(null, 'width', this.width);
		this._.$pathsSVG.setAttributeNS(null, 'height', this.height);
		this._.$pathsSVG.style.position = "absolute";
		this._.$pathsSVG.style.zIndex = 1;
		this._.$pathsSVG.style.transform = "scale(1,-1)";

		this._.onchange = (property, newValue) => {
			if (property === 'width' || property === 'height') {
				this._.$pathsSVG.setAttributeNS(null, 'width', this.width);
				this._.$pathsSVG.setAttributeNS(null, 'height', this.height);
			}
		};

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

	}

	set(datum, $path) {
		$path = super.set(datum, $path);

		$path.setAttributeNS(null, 'stroke', this._.accessors.color(datum));
		$path.setAttributeNS(null, 'stroke-width', this._.accessors.width(datum));
		$path.setAttributeNS(null, 'fill', 'none');

		datum.start();
		let entry = datum.next();
		let x, y, d = "";
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

		$path.setAttributeNS(null, 'd', d);

		return $path;
	}

	create_element() {
		return document.createElementNS("http://www.w3.org/2000/svg", this._.layerElementTagName);
	}

	allocate_element(datum) {
		let $path = super.allocate_element(datum);

		$path.safk = $path.safk || {};

		return $path;
	}

}

export { PathsLayer };