'use strict'

class SimpleEditController {
	
	constructor(params) {
		this._ = {};
		const that = this;
		this._.layer = params.layer;
		this._.lastEventType = undefined;
		this._.lastCoords = { x: undefined, y: undefined };
		this._.selectionManager = params.selectionManager || new SelectionManager();

		this._.beingSelected = new List();
		this._.beingUnselected = new List();
		this._.updateIterator = {
			start: function(layer) {
				this.entry = this.entry || {};
				this.entry.value = undefined; 
				this.entry.done = false;
			}, 
			next: function() {
				let next = that._.beingSelected.pop() || that._.beingUnselected.pop();
				this.entry.value = next;
				this.entry.done = (next)? false : true;
				return this.entry;
			}, 
			stop: function() {
				this.entry.value = undefined; 
				this.entry.done = false;
			}
		};

		this._.mousedown = (e) => {
			that._.lastEventType = e.type;
			that._.lastCoords.x = e.clientX;
			that._.lastCoords.y = e.clientY;

			that._.selection_check(e);

			that._.layer.layerDomEl.addEventListener('mousemove', that._.drag);
			that._.layer.layerDomEl.addEventListener('mouseup', that._.dragend);
		};

		this._.drag = (e) => {
			that._.lastEventType = e.type;

			that._.layer.layerDomEl.removeEventListener('mousedown', that._.mousedown);

			this._.selectionManager.apply_on_selected(this._.layer, (datum) => {
				let dx = e.clientX - that._.lastCoords.x;
				let px = that._.layer._.timeToPixel(datum.time);
				datum.time = that._.layer._.timeToPixel.invert(px + dx);
				// that._.layer.set(datum);
				that._.beingSelected.push(datum);
			}, () => {
				that._.layer.update(that._.updateIterator);
			});

			that._.lastCoords.x = e.clientX;
			that._.lastCoords.y = e.clientY;
		};

		this._.dragend = (e) => {
			that._.lastCoords.x = e.clientX;
			that._.lastCoords.y = e.clientY;
			that._.layer.layerDomEl.removeEventListener('mousemove', that._.drag);
			that._.layer.layerDomEl.removeEventListener('mouseup', that._.dragend);
			that._.lastEventType = e.type;

			that._.layer.layerDomEl.addEventListener('mousedown', that._.mousedown);
		};

		this._.selection_check = (e) => {
			let update = false;
			if (!e.shiftKey) {
				this._.selectionManager.unselect_all(this._.layer, (datum) => { that._.beingUnselected.push(datum); });
				update = true;
			} 
			var datum, 
				tagName = e.target.tagName, 
				layerTagName = this._.layer.layerDomEl.tagName;

			var hash = null;
			var $el = e.target;
			while (hash === null && tagName !== layerTagName) {
				hash = $el.getAttribute(this._.layer._.layerElementDatumHashAttribute);
				$el = $el.parentElement;
			}

			if (hash !== undefined) 
				datum = this._.layer.get_datum(hash);

			if (datum) {
				that._.selectionManager.select(this._.layer, datum, (datum) => { that._.beingSelected.push(datum); });
				update = true;
			}

			if (update) 
				that._.layer.update(that._.updateIterator);
		};

		this._.layer.layerDomEl.addEventListener('mousedown', this._.mousedown);
	}
}