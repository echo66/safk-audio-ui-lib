'use strict'

import { EventEmitter } from '../utils/event-emitter.js';

class Track extends EventEmitter {
	constructor(params) {
		super();

		this._ = {};

		this._.width = (params.width !== undefined)? params.width : 800;
		this._.height = (params.height !== undefined)? params.height : 100;
		this._.visible = (params.visible !== undefined)? params.visible : true;

		this._.safkCustomProperty = (params.safkCustomProperty !== undefined)? params.safkCustomProperty : "safk";

		this._.$trackContainer = document.createElement('div');
		this._.$trackContainer.style.width = this._.width + "px";
		this._.$trackContainer.style.height = this._.height + "px";
		this._.$trackContainer.setAttribute('name', 'track-container');

		this._.$layersContainer = document.createElement('div');
		this._.$layersContainer.style.width = this._.width + "px";
		this._.$layersContainer.style.height = this._.height + "px";
		this._.$layersContainer.style.left = "0px";
		this._.$layersContainer.style.top = "0px";
		this._.$layersContainer.style.position = "absolute";
		this._.$layersContainer.setAttribute('name', 'layers-container');

		this._.$interactionsContainer = document.createElement('div');
		this._.$interactionsContainer.style.width = this._.width + "px";
		this._.$interactionsContainer.style.height = this._.height + "px";
		this._.$interactionsContainer.style.left = "0px";
		this._.$interactionsContainer.style.top = "0px";
		this._.$interactionsContainer.style.position = "absolute";
		this._.$interactionsContainer.style.pointerEvents = "none";
		this._.$interactionsContainer.setAttribute('name', 'interactions-container');

		this._.$trackContainer.appendChild(this._.$layersContainer);
		this._.$trackContainer.appendChild(this._.$interactionsContainer);
		// params.$parent.appendChild(this._.$trackContainer);

		this._.$layersContainer.style.zIndex = 1;
		this._.$interactionsContainer.style.zIndex = 2;

		this._.timeDomain = params.timeDomain || [0, 10];

		this._.layers = new Set();
	}

	destroy() {
		var $els = this._.$layersContainer.childNodes;
		for (var i=0; i<$els.length; i++) {
			var $el = $els[i];
			var layer = $el[this._.safkCustomProperty].layer;
			layer.destroy();
		}
	}

	get trackDomEl() {
		return this._.$trackContainer;
	}

	get layersDomEl() {
		return this._.$layersContainer;
	}

	get interactionsDomEl() {
		return this._.$interactionsContainer;
	}

	get width() {
		return this._.width;
	}

	set width(v) {
		this._.width = v;

		this._.$trackContainer.style.width = v + "px";
		this._.$layersContainer.style.width = v + "px";
		this._.$interactionsContainer.style.width = v + "px";

		var $els = this._.$layersContainer.childNodes;
		for (var i=0; i<$els.length; i++) {
			var $el = $els[i];
			var layer = $el[this._.safkCustomProperty].layer;
			layer.width = v;
		}

		this.emit('changed-property-width');
	}

	get height() {
		return this._.height;
	}

	set height(v) {
		this._.height = v;
		
		this._.$trackContainer.style.height = v + "px";
		this._.$layersContainer.style.height = v + "px";
		this._.$interactionsContainer.style.height = v + "px";

		var $els = this._.$layersContainer.childNodes;
		for (var i=0; i<$els.length; i++) {
			var $el = $els[i];
			var layer = $el[this._.safkCustomProperty].layer;
			layer.height = v;
		}

		this.emit('changed-property-height');
	}

	get visible() {
		return this._.visible;
	}

	set visible(v) {
		this._.visible = v;
		var $els = this._.$layersContainer.childNodes;
		for (var i=0; i<$els.length; i++) {
			var $el = $els[i];
			var layer = $el[this._.safkCustomProperty].layer;
			layer.visible = v;
		}

		this.emit('changed-property-visible');
	}

	get timeDomain() {
		return this._.timeDomain;
	}

	set timeDomain(v) {
		this._.timeDomain[0] = v[0];
		this._.timeDomain[1] = v[1];

		var $els = this._.$layersContainer.childNodes;
		for (var i=0; i<$els.length; i++) {
			var $el = $els[i];
			var layer = $el[this._.safkCustomProperty].layer;
			layer.timeDomain = this._.timeDomain;
		}

		this.emit('changed-property-timeDomain');
	}

	get layers() {
		// const that = this;
		// var it = {
		// 	_index: 0, 
		// 	_entry: { value: undefined, done: undefined }, 
		// 	next: function() {
		// 		if (that._.$layersContainer.childNodes[this._index]) { 
		// 			this._entry.value = that._.$layersContainer.childNodes[this._index];
		// 			this._entry.done = false;
		// 			this._index++;
		// 		} else {
		// 			this._entry.value = undefined;
		// 			this._entry.done = true;
		// 		}
		// 		return this._entry;
		// 	}
		// }
		// return it;
		return this._.layers.values();
	}

	has(layer) {
		// var $els = this._.$layersContainer.childNodes;
		// for (var i=0; i<$els.length; i++) {
		// 	var $el = $els[i];
		// 	if ($el === layer.layerDomEl) 
		// 		return true;
		// }
		// return false;
		return this._.layers.has(layer);
	}

	add(layer) {
		this._.$layersContainer.appendChild(layer.layerDomEl);
		layer.layerDomEl.style.position = "absolute";
		layer.layerDomEl.style.top = "0px";
		layer.layerDomEl.style.left = "0px";
		layer.width   = this._.width;
		layer.height  = this._.height;
		layer.visible = this._.visible;
		layer.timeDomain = this._.timeDomain;
		this._.layers.add(layer);

		this.emit('added-layer', layer);
	}

	remove(layer) {
		if (this.has(layer)) {
			layer.layerDomEl.remove();
			this._.layers.delete(layer);
			this.emit('removed-layer', layer);
		}
	}

	update() {
		var $els = this._.$layersContainer.childNodes;
		for (var i=0; i<$els.length; i++) {
			var $el = $els[i];
			var layer = $el[this._.safkCustomProperty].layer;
			layer.update();
		}
	}

	has_element($el) {
		var layersIt = this.layers;

		var entry = layersIt.next();
		var layer = entry.value;

		while (!entry.done) {
			if (layer.has_element($el))
				return true;

			entry = layersIt.next();
			layer = entry.value;
		}

		return false;
	}

	get_element_layer($el) {
		var layersIt = this.layers;

		var entry = layersIt.next();
		var layer = entry.value;

		while (!entry.done) {
			if (layer.has_element($el))
				return layer;

			entry = layersIt.next();
			layer = entry.value;
		}

		return undefined;
	}
}

export { Track };