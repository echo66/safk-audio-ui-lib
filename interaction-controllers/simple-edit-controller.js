'use strict'

class SimpleEditController extends EventEmitter {
	
	constructor(params) {
		super();
		const that = this;
		this._ = {};
		this._.layer = params.layer;
		this._.lastEventType = undefined;
		this._.lastCoords = { x: undefined, y: undefined };
		this._.selectionManager = params.selectionManager || new SelectionManager();
		this._.accessors = params.accessors || {
			time: (d, v) => {
				if (!isNaN(v)) 
					d.time = v;
				return d.time;
			}, 
			zIndex: (d, v) => { // TODO: where will I use this?
				if (!isNaN(v)) 
					d.zIndex = v;
				return d.zIndex;
			}
		}

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

		this._on_mousedown = (e) => {
			this._.lastEventType = e.type;
			this._.lastCoords.x = e.clientX;
			this._.lastCoords.y = e.clientY;
			this._.startingEl = e.target;

			this._selection_check(e);

			this._.layer.layerDomEl.addEventListener('mousemove', this._on_drag);
			this._.layer.layerDomEl.addEventListener('mouseup', this._on_dragend);
		};

		this._on_drag = (e) => {
			const that = this;

			let lastEventType = this._.lastEventType;

			if (lastEventType === 'mousedown') {
				this.emit('start-edit-layer', that._.layer);
				this._.selectionManager.apply_on_selected(this._.layer, (datum) => {
					this.emit('start-edit-datum', that._.layer, datum);
				});
			}

			this._.lastEventType = e.type;

			this._.layer.layerDomEl.removeEventListener('mousedown', this._on_mousedown);

			this._.selectionManager.apply_on_selected(this._.layer, (datum) => {
				let dx = e.clientX - this._.lastCoords.x;
				let dy = e.clientY - this._.lastCoords.y;
				this._edit_datum(datum, that._.startingEl, e, dx, dy);
				this._.beingSelected.push(datum);
				this.emit('edit', that._.layer, datum);
			}, () => {
				this._.layer.update(this._.updateIterator);
			});

			this._.lastCoords.x = e.clientX;
			this._.lastCoords.y = e.clientY;

			this.emit('edit-layer', that._.layer);
		};

		this._on_dragend = (e) => {
			let lastEventType = this._.lastEventType;

			this._.startingEl = undefined;
			this._.lastCoords.x = e.clientX;
			this._.lastCoords.y = e.clientY;
			this._.layer.layerDomEl.removeEventListener('mousemove', this._on_drag);
			this._.layer.layerDomEl.removeEventListener('mouseup', this._on_dragend);
			this._.lastEventType = e.type;

			this._.layer.layerDomEl.addEventListener('mousedown', this._on_mousedown);

			if (lastEventType === 'mousemove') {
				const that = this;
				this._.selectionManager.apply_on_selected(this._.layer, (datum) => {
					this.emit('end-edit', that._.layer, datum);
				});
				this.emit('end-edit-layer', that._.layer);
			}
		}

		this._selection_check = (e) => {
			let update = false;
			if (!e.shiftKey) {
				this._.selectionManager.unselect_all(this._.layer, (datum) => { this._.beingUnselected.push(datum); });
				update = true;
			} 
			var datum, 
				layerTagName = this._.layer.layerDomEl.tagName;

			var hash = null;
			var $el = e.target;
			while (hash === null && $el.tagName !== layerTagName) {
				hash = $el.getAttribute(this._.layer._.layerElementDatumHashAttribute);
				$el = $el.parentElement;
			}

			if (hash !== undefined) 
				datum = this._.layer.get_datum(hash);

			if (datum) {
				this._.selectionManager.select(this._.layer, datum, (datum) => { this._.beingSelected.push(datum); });
				update = true;
			}

			if (update) 
				this._.layer.update(this._.updateIterator);
		}

		this._.layer.layerDomEl.addEventListener('mousedown', this._on_mousedown);
	}

	__edit(datum, accessorName, delta, scale) {
		let oldValue = this._.accessors[accessorName](datum);
		let oldCoord = scale(oldValue);
		let newCoord = oldCoord + delta;
		let newValue = scale.invert(newCoord);

		return newValue;
	}

	_edit_datum(datum, startingEl, e, dx, dy) {
		let newStartTime = this.__edit(datum, 'time', dx, this._.layer._.timeToPixel);
		(!isNaN(newStartTime)) && this._.accessors.time(datum, newStartTime);
	}

	is_editing(layer, datum) {
		if (this._.lastEventType === 'mousemove') {
			return this.selectionManager.is_selected(layer, datum);
		}
		return false;
	}

	get selectionManager() {
		return this._.selectionManager;
	}
}