'use strict'

import { Layer } from './layer.js';

export class PointsLayer extends Layer {

	constructor(params) {
		super({
			height: params.height || 100, 
			width: params.width || 500, 
			defaultIterator: undefined, 
			timeDomain: params.timeDomain || [0, 20], 
			valueDomain: params.valueDomain || [0, 1], 
			layerTagName: 'layer', 
			layerElementTagName: 'g', 
			layerElementDatumHashAttribute: 'data-hash', 
		});

		const that = this;

		this._.$pointsSVG = document.createElementNS("http://www.w3.org/2000/svg", 'svg');

		this._.layerElementsParent = this._.$pointsSVG;

		this._.$el.children[0].appendChild(this._.$pointsSVG);

		this._configure_svg_container(this._.$pointsSVG);

		// this._.onchange = (property, newValue) => {
		// 	if (property === 'width' || property === 'height') {
		// 		this._.$pointsSVG.setAttributeNS(null, 'width', this.width);
		// 		this._.$pointsSVG.setAttributeNS(null, 'height', this.height);
		// 	}
		// };

		this.on('changed-property-width', () => {
			this._.$pointsSVG.setAttributeNS(null, 'width', this.width);
			this._.$pointsSVG.setAttributeNS(null, 'height', this.height);
		});

		this.on('changed-property-timeDomain', () => {
			that._configure_svg_container(that._.$pointsSVG);
		});

		// DEFINE ACCESSORS
		{
			this.accessor('time', (d) => { 
				return d.time; 
			});
			this.accessor('value', (d) => { 
				return d.value; 
			});
			this.accessor('radius', (d) => { 
				return d.radius || 2; 
			});
			this.accessor('color', (d, elementName) => { 
				/*
				 * 'circle' 'text' 
				 */
				return 'cyan';
			});
			this.accessor('text', (d) => { 
				return '';
			});
			this.accessor('textOffset', (d, axis) => { 
				/*
				 * 'x' 'y' 
				 */
				return 0;
			});
			this.accessor('fontFamily', (d) => { 
				/*
				 */
				return 'Verdana';
			});
			this.accessor('fontSize', (d) => { 
				/*
				 */
				return 5;
			});

			this.accessor('zIndex', (d, elementName) => { 
				/*
				 * 'circle' 'text' 'group'  
				 */
				return (d.zIndex !== undefined)? d.zIndex : 1;
			});
			this.accessor('opacity', (d, elementName) => { 
				/*
				 * 'circle' 'text' 'group' 
				 */
				return (d.opacity !== undefined)? d.opacity : 1;
			});
			this.accessor('visible', (d, elementName) => { 
				/*
				 * 'circle' 'text' 'group' 
				 */
				return (d.visible !== undefined)? d.visible : true; 
			});
		}

	}

	_configure_svg_container($container) {
		$container.setAttributeNS(null, 'width', this.width);
		$container.setAttributeNS(null, 'height', this.height);
		$container.style.position = "absolute";
		$container.style.zIndex = 1;
		$container.style.left = (this._.timeToPixel(this._.timeOffset)) + "px";
		$container.style.transform = "scale(1,-1) translate(" + (this._.timeToPixel(-this._.timeOffset)) + ",0)";
	}

	_configure_circle(circle, datum) {
		circle.setAttributeNS(null, 'cx', 0);
		circle.setAttributeNS(null, 'cy', 0);
		circle.setAttributeNS(null, 'r', this._.accessors.radius(datum));
		circle.style.fill = this._.accessors.color(datum, 'point');
		circle.style.opacity = this._.accessors.opacity(datum, 'point');
		circle.style.display = (this._.accessors.visible(datum, 'point'))? 'block' : 'none';
		circle.style.zIndex = this._.accessors.zIndex(datum, 'point');
	}

	_configure_group(group, datum) {
		group.setAttributeNS(null, 'transform', 'translate(' + 
													this._.timeToPixel(this._.accessors.time(datum)) + ' ' + 
													this._.valueToPixel(this._.accessors.value(datum)) + ') ' + 
													'scale(1,-1)');
		group.style.display = (this._.accessors.visible(datum, 'group'))? 'block' : 'none';
		group.style.zIndex = this._.accessors.zIndex(datum, 'group');
	}

	_configure_text(text, datum) {
		text.setAttributeNS(null, 'x', this._.accessors.textOffset(datum, 'x'));
		text.setAttributeNS(null, 'y', this._.accessors.textOffset(datum, 'y'));
		text.setAttributeNS(null, 'fill', this._.accessors.color(datum, 'text'));
		text.setAttributeNS(null, 'font-size', this._.accessors.fontSize(datum));
		text.setAttributeNS(null, 'font-family', this._.accessors.fontFamily(datum));
		text.style.opacity = this._.accessors.opacity(datum, 'text');
		text.style.display = (this._.accessors.visible(datum, 'text'))? 'block' : 'none';
		text.innerHTML = this._.accessors.text(datum);

		return text;
	}

	set(datum, $group) {

		$group = super.set(datum, $group);

		this._configure_group($group, datum);

		this._configure_text($group.safk.text, datum);

		this._configure_circle($group.safk.circle, datum);

		return $group;
	}

	create_element() {
		return document.createElementNS("http://www.w3.org/2000/svg", this._.layerElementTagName);
	}

	allocate_element(datum) {
		let $group = super.allocate_element(datum);

		$group.safk = $group.safk || {};

		if (!$group.safk.circle) $group.appendChild($group.safk.circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle'));
		
		if (!$group.safk.text) $group.appendChild($group.safk.text = document.createElementNS("http://www.w3.org/2000/svg", 'text'));

		return $group;
	}

}