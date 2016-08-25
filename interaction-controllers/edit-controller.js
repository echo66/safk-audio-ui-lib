'use strict'

class EditController {
	
	constructor(params) {
		this._ = {};
		this._.selectedData = new Set();
		this._.layer = params.layer;
		this._.lastEventType = undefined;
		this._.lastCoords = { x: undefined, y: undefined };

		const that = this;

		this._.mousedown = (e) => {
			that._.lastEventType = e.type;
			that._.lastCoords.x = e.clientX;
			that._.lastCoords.y = e.clientY;

			that._.selectioncheck(e);

			that._.layer.on('mousemove', that._.drag);
			that._.layer.on('mouseup', that._.dragend);
		};

		this._.drag = (e) => {
			// if (that._.lastEventType === 'mousemove')
				// console.log('drag');
			// else if (that._.lastEventType === 'mousedown')
				// console.log('start drag');
			that._.lastEventType = e.type;

			that._.layer.off('mousedown', that._.mousedown);

			that._.selectedData.forEach((datum) => {
				let dx = e.clientX - that._.lastCoords.x;
				let px = that._.layer._.timeToPixel(datum.time);
				datum.time = that._.layer._.timeToPixel.invert(px + dx);
				that._.layer.set(datum);
			});

			that._.lastCoords.x = e.clientX;
			that._.lastCoords.y = e.clientY;
		};

		this._.dragend = (e) => {
			that._.lastCoords.x = e.clientX;
			that._.lastCoords.y = e.clientY;
			that._.layer.off('mousemove', that._.drag);
			that._.layer.off('mouseup', that._.dragend);
			// console.log('end drag');
			that._.lastEventType = e.type;

			that._.layer.on('mousedown', that._.mousedown);
			// targetDatum = undefined;
		};

		this._.selectioncheck = (e) => {
			if (!e.shiftKey) {
				that._.selectedData.clear();
				// console.log('unselected all');
			} 
			var datum, 
				tagName = e.target.tagName.toLowerCase();

			if (tagName === 'segment') {
				datum = e.target.datum;
			} else {
				datum = e.target.parentElement.datum;
			}

			if (datum) {
				that._.selectedData.add(datum);
			}

			that._.layer.update();
		};

		this._.layer.on('mousedown', this._.mousedown);
	}

	get selectedData() {
		return this._.selectedData;
	}
}