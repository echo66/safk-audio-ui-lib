'use strict'

// import { Layer } from 'layer.js';

class PointsLayer extends Layer {

	constructor(params) {
		super({
			height: params.height || 100, 
			width: params.width || 500, 
			defaultIterator: undefined, 
			timeDomain: params.timeDomain || [0, 20], 
			valueDomain: params.valueDomain || [0, 1], 
			layerTagName: 'layer', 
			layerElementTagName: 'g', 
			layerElementDatumHashAttribute: 'data-hash'
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
				return 'Verdana';
			});
			this.accessor('fontSize', (d) => { 
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

		this._.pointsSVG = document.createElementNS("http://www.w3.org/2000/svg", 'svg');

		this._.$el.appendChild(this._.pointsSVG);

		this._.pointsSVG.setAttributeNS(null, 'width', '100%');
		this._.pointsSVG.setAttributeNS(null, 'height', '100%');
		this._.pointsSVG.style.position = "absolute";
		this._.pointsSVG.style.zIndex = 1;
		this._.pointsSVG.style.transform = "scale(1,-1)";

	}

	_configure_circle(circle, datum) {
		circle.setAttributeNS(null, 'cx', 0);
		circle.setAttributeNS(null, 'cy', 0);
		circle.setAttributeNS(null, 'r', this._.accessors.radius(datum));
		circle.style.fill = this._.accessors.color(datum, 'point');
		circle.style.opacity = this._.accessors.opacity(datum, 'point');
		circle.style.display = (this._.accessors.visible(datum, 'point'))? 'inline' : 'none';
		circle.style.zIndex = this._.accessors.zIndex(datum, 'point');
	}

	_configure_group(group, datum) {
		group.setAttributeNS(null, 'transform', 'translate(' + 
													this._.timeToPixel(this._.accessors.time(datum)) + ' ' + 
													this._.valueToPixel(this._.accessors.value(datum)) + ') ' + 
													'scale(1, -1)');
	}

	_configure_text(text, datum) {
		text.setAttributeNS(null, 'x', this._.accessors.textOffset(datum, 'x'));
		text.setAttributeNS(null, 'y', this._.accessors.textOffset(datum, 'y'));
		text.setAttributeNS(null, 'fill', this._.accessors.color(datum, 'text'));
		text.setAttributeNS(null, 'font-size', this._.accessors.fontSize(datum));
		text.setAttributeNS(null, 'font-family', this._.accessors.fontFamily(datum));
		text.style.opacity = this._.accessors.opacity(datum, 'text');
		text.style.display = (this._.accessors.visible(datum, 'text'))? 'inline' : 'none';
		text.innerHTML = this._.accessors.text(datum);

		return text;
	}

	set(datum) {
		let hash = this.get_hash(datum);
		var group, circle, text;
		
		group = this.get_element(hash);

		if (group) {

			circle = group.querySelector('circle');
			text  = group.querySelector('text');

		} else if (group = this._.unusedDomElsList.pop()) {

			circle = group.querySelector('circle');
			text  = group.querySelector('text');

			this.associate_element_to(group, hash);

		} else {
			group = document.createElementNS("http://www.w3.org/2000/svg", 'g');
			circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
			text = document.createElementNS("http://www.w3.org/2000/svg", 'text');

			group.appendChild(circle);
			group.appendChild(text);
			this._.pointsSVG.appendChild(group);

			this.associate_element_to(group, hash);
		}

		this._configure_group(group, datum);

		this._configure_text(text, datum);

		this._configure_circle(circle, datum);
		

		return group;
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
		return this._.pointsSVG.querySelector('g[data-hash="' + hash + '"]');
	}

	/*
	 * Remove the DOM (or, in specific cases, the rendered object) associated with the datum hash.
	 */
	unassociate_element_to($el, hash) {
		$el.removeAttribute('data-hash');
		delete $el.datum;
	}

}