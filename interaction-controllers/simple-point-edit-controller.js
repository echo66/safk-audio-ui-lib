'use strict'

class SimplePointEditController extends SimpleEditController {
	constructor(params) {
		super(params);

		this._.accessors.value = (d, v) => {
			if (!isNaN(v)) 
					d.value = v;
				return d.value;
		};

		this._.allow = {};
		this._.allow.xEdit = (params.allowXEdit !== undefined)? params.allowXEdit : true;
		this._.allow.yEdit = (params.allowYEdit !== undefined)? params.allowYEdit : true;
	}

	_edit_datum(datum, startingEl, e, dx, dy) {
		if (this._.allow.xEdit) {
			let newTime = this.__edit(datum, 'time', dx, this._.layer._.timeToPixel);
			(!isNaN(newTime)) && this._.accessors.time(datum, newTime);
		}

		if (this._.allow.yEdit) {
			let newValue = this.__edit(datum, 'value', dx, this._.layer._.valueToPixel);
			(!isNaN(newValue)) && this._.accessors.value(datum, newValue);
		}
	}
}