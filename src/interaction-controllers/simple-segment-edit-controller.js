'use strict'

import { SimpleEditController } from './simple-edit-controller.js';

class SimpleSegmentEditController extends SimpleEditController {

	constructor(params) {
		super(params);

		var accessors = params.accessors || {};

		this._.accessors.duration = accessors.duration || ((d, v) => {
			if (!isNaN(v)) 
					d.duration = v;
				return d.duration;
		});
		this._.accessors.lowValue = accessors.lowValue || ((d, v) => {
			if (!isNaN(v)) 
					d.lowValue = v;
				return d.lowValue;
		});
		this._.accessors.highValue = accessors.highValue || ((d, v) => {
			if (!isNaN(v)) 
					d.highValue = v;
				return d.highValue;
		});

		this._.allow = {};
		this._.allow.xEdit = (params.allowXEdit !== undefined)? params.allowXEdit : true;
		this._.allow.yEdit = (params.allowYEdit !== undefined)? params.allowYEdit : true;
	}

	_edit_datum(datum, startingEl, e, dx, dy) {
		let elementName = startingEl.tagName.toLowerCase();
		let timeToPixel = this._.layer._.timeToPixel;
		let valueToPixel = this._.layer._.valueToPixel;
		switch (elementName) {

			case 'handler': 
				let handlerName = startingEl.getAttribute('handler');
				switch (handlerName) {
					case 'left': 
						if (this._.allow.xEdit) {
							let newStartTime = this._generate_datum_value(datum, 'time', dx, timeToPixel);
							let newDuration = this._generate_datum_value(datum, 'duration', -dx, timeToPixel);

							(!isNaN(newStartTime)) && this._.accessors.time(datum, newStartTime);
							(!isNaN(newDuration)) && (newDuration > 0) && this._.accessors.duration(datum, newDuration);
						}
						break;
					case 'right': 
						if (this._.allow.xEdit) {
							let newDuration = this._generate_datum_value(datum, 'duration', dx, timeToPixel);
							(!isNaN(newDuration)) && (newDuration > 0) && this._.accessors.duration(datum, newDuration);
						}
						break;
					case 'top': 
						if (this._.allow.yEdit) {
							let newHighValue = this._generate_datum_value(datum, 'highValue', -dy, valueToPixel);
							(!isNaN(newHighValue)) && this._.accessors.highValue(datum, newHighValue);
						}
						break;
					case 'bottom': 
						if (this._.allow.yEdit) {
							let newLowValue = this._generate_datum_value(datum, 'lowValue', -dy, valueToPixel);
							(!isNaN(newLowValue)) && this._.accessors.lowValue(datum, newLowValue);
						}
						break;
				}
				break;

			default: 
				if (this._.allow.xEdit) {
					let newStartTime = this._generate_datum_value(datum, 'time', dx, timeToPixel);
					(!isNaN(newStartTime)) && this._.accessors.time(datum, newStartTime);
				}
				if (this._.allow.yEdit) {
					let newLowValue = this._generate_datum_value(datum, 'lowValue', -dy, valueToPixel);
					let newHighValue = this._generate_datum_value(datum, 'highValue', -dy, valueToPixel);

					(!isNaN(newLowValue)) && this._.accessors.lowValue(datum, newLowValue);
					(!isNaN(newHighValue)) && this._.accessors.highValue(datum, newHighValue);
				}
				break;

		}
	}

}

export { SimpleSegmentEditController };