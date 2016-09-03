'use strict'

// import { Layer } from 'layer.js';

class TimeAxisLayer extends Layer {

	constructor(params) {
		super({
			height: params.height || 100, 
			width: params.width || 500, 
			defaultIterator: undefined, 
			timeDomain: params.timeDomain || [0, 20], 
			valueDomain: params.valueDomain || [0, 1], 
			layerTagName: 'layer', 
			layerElementTagName: 'axis', 
			layerElementDatumHashAttribute: 'data-hash'
		});

		const that = this;

		this.accessor('time', (d) => {
			/* */
			return d.time;
		});
		this.accessor('color', (d, elementName) => {
			/* 'tick' 'text' */
			if (elementName === 'tick') {
				return d.tickColor;
			} else if (elementName === 'text') {
				return d.fontColor;
			}
		});
		this.accessor('width', (d) => {
			/* */
			return d.tickWidth;
		});
		this.accessor('height', (d) => {
			/* */
			return d.tickHeight || that.height;
		});
		this.accessor('text', (d) => {
			/* */
			return d.text || '';
		});
		this.accessor('textOffset', (d, axis) => {
			/* 'x' 'y' */
			if (axis === 'x') {
				return d.textOffsetX || 0;
			} else if (axis === 'y') {
				return d.textOffsetY || 0;
			}
		});
		this.accessor('fontSize', (d) => {
			/* */
			return d.fontSize ||  5;
		});
		this.accessor('fontFamily', (d) => {
			/* */
			return d.fontFamily || 'Verdana';
		});
		this.accessor('opacity', (d, elementName) => {
			/* 'tick' 'text' 'tick-container' */
			if (elementName === 'tick') {
				return d.tickColor;
			} else if (elementName === 'text') {
				return d.fontColor;
			} else if (elementName === 'tick-container') {
				return (d.opacity != undefined)? d.opacity : 1;
			}
		});
		this.accessor('zIndex', (d, elementName) => {
			/* 'tick' 'text' */
			switch (elementName) {
				case 'tick': return 1;
				case 'text': return 2;
				default: return 1;
			}
		});
		this.accessor('visible', (d, elementName) => {
			/* 'tick-container' 'tick' 'text' 'axis' */
			return true;
		});

		this.refreshOnScroll = true;
	}

	removeUnused() {
		super.removeUnused();
		var $axes = this._.$container.children;
		for (var i=0; i<$axes.length; i++) {
			var $axis = $axes[i];
			while ($axis.safk.unusedDomEls.size) {
				$axis.safk.unusedDomEls.pop().remove();
			}
		}
	}

	_allocate_tick_container($axis) {
		var $tickContainer = $axis.safk.activeDomEls.pop() || $axis.safk.unusedDomEls.pop();

		if (!$tickContainer) {
			$tickContainer = document.createElement('tick-container');
			$tickContainer.setAttribute('unused', false);
			var $tick = document.createElement('tick');
			var $text = document.createElement('span');
			$tickContainer.appendChild($tick);
			$tickContainer.appendChild($text);
			$tickContainer.safk = {};
			$tickContainer.safk.tick = $tick;
			$tickContainer.safk.text = $text;
			$axis.appendChild($tickContainer);
		}

		return $tickContainer;
	}

	_deallocate_tick_container($axis, $tickContainer) {
		$tickContainer.style.display = "none";
		$tickContainer.setAttribute('unused', true);
		$axis.safk.unusedDomEls.push($tickContainer);
	}

	_configure_tick_container(datum, $tickContainer) {
		$tickContainer.style.position = "absolute";
		$tickContainer.style.left = this._.timeToPixel(this._.accessors.time(datum)) + "px";
		$tickContainer.style.top = "0px";
		$tickContainer.style.display = "block";
		$tickContainer.style.opacity = this._.accessors.opacity(datum, 'tick-container');
		$tickContainer.style.display = (this._.accessors.visible(datum, 'tick-container'))? 'block' : 'none';

		return $tickContainer;
	}

	_configure_tick(datum, $tick) {
		$tick.style.position = "absolute";
		$tick.style.width = this._.accessors.width(datum) + "px";
		$tick.style.left = "0px";
		$tick.style.top = "0px";
		$tick.style.height = this._.accessors.height(datum) + "px";
		$tick.style.zIndex = 1;
		$tick.style.backgroundColor = this._.accessors.color(datum, 'tick');
		$tick.style.opacity = this._.accessors.opacity(datum, 'tick');
		$tick.style.zIndex = this._.accessors.zIndex(datum, 'tick');
		$tick.style.display = (this._.accessors.visible(datum, 'tick'))? 'block' : 'none';
		
		return $tick;
	}

	_configure_text(datum, $text) {
		$text.style.position = "absolute";
		$text.style.top = this._.accessors.textOffset(datum, 'y') + "px";
		$text.style.left = this._.accessors.textOffset(datum, 'x') + "px";
		$text.style.color = this._.accessors.color(datum, 'text');
		$text.style.fontSize = this._.accessors.fontSize(datum) + "px";
		$text.style.fontFamily = this._.accessors.fontFamily(datum);
		$text.style.opacity = this._.accessors.opacity(datum, 'text');
		$text.style.zIndex = this._.accessors.zIndex(datum, 'text');
		$text.style.display = (this._.accessors.visible(datum, 'text'))? 'block' : 'none';
		$text.innerText = this._.accessors.text(datum);

		return $text;
	}

	set(datum, $axis) {
		$axis = super.set(datum, $axis);

		$axis.style.pointerEvents = "none";

		datum.start(this);
		let entry = datum.next();
		while (!entry.done) {
			var $tickContainer = this._allocate_tick_container($axis);
			$axis.safk.auxList.push($tickContainer);

			this._configure_tick_container(entry.value, $tickContainer);
			this._configure_tick(entry.value, $tickContainer.safk.tick);
			this._configure_text(entry.value, $tickContainer.safk.text);

			entry = datum.next();
		}
		datum.stop();

		while ($axis.safk.activeDomEls.size > 0) {
			this._deallocate_tick_container($axis, $axis.safk.activeDomEls.pop());
		}

		while ($axis.safk.auxList.size > 0) {
			var $tickContainer = $axis.safk.auxList.pop();
			$tickContainer.setAttribute('unused', false);
			$axis.safk.activeDomEls.push($tickContainer);
		}

		$axis.style.display = (this._.accessors.visible(datum, 'axis'))? 'block' : 'none';

		return $axis;
	}

	allocate_element(datum) {
		var $axis = super.allocate_element(datum);

		$axis.safk = $axis.safk || {};

		$axis.safk.activeDomEls = $axis.safk.activeDomEls || new List();

		$axis.safk.unusedDomEls = $axis.safk.unusedDomEls || new List();

		$axis.safk.auxList = $axis.safk.auxList || new List();

		return $axis;
	}

}