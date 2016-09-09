'use strict'

import { EventEmitter } from '../utils/event-emitter.js';

export class SelectionManager extends EventEmitter {
	constructor() {
		super();
		this.selectedData = new Map();
	}

	select(layer, datum, callback) {
		var selectedDataOnLayer = this.selectedData.get(layer);
		if (selectedDataOnLayer) {
			var hash = layer.get_hash(datum);
			if (!selectedDataOnLayer.has(hash)) {
				selectedDataOnLayer.add(hash);
				callback && callback(datum);
				this.emit('selected', layer, datum);
			}
		} else {
			var hash = layer.get_hash(datum);
			var selectedDataOnLayer = new Set();
			this.selectedData.set(layer, selectedDataOnLayer);
			selectedDataOnLayer.add(hash);
			callback && callback(datum);
			this.emit('selected', layer, datum);
		}
	}

	is_selected(layer, datum) {
		var selectedDataOnLayer = this.selectedData.get(layer);
		if (selectedDataOnLayer) {
			var hash = layer.get_hash(datum);
			if (selectedDataOnLayer.has(hash)) 
				return true;
		}
		return false;
	}

	unselect(layer, datum, callback) {
		var selectedDataOnLayer = this.selectedData.get(layer);
		var hash = layer.get_hash(datum);
		if (selectedDataOnLayer && selectedDataOnLayer.has(hash)) {
			selectedDataOnLayer.delete(hash);
			if (selectedDataOnLayer.size === 0) 
				this.selectedData.delete(layer);
			callback && callback(datum);
			this.emit('unselected', layer, datum);
		}
	}

	unselect_all(layer, eachCallback, finalCallback) {
		// const that = this;
		var selectedDataOnLayer = this.selectedData.get(layer);
		if (selectedDataOnLayer) {
			var it = selectedDataOnLayer.values();
			var entry = it.next();
			while (!entry.done) {
				var hash = entry.value;
				var datum = layer.get_datum(hash);
				selectedDataOnLayer.delete(hash);
				eachCallback && eachCallback(datum);
				var entry = it.next();
			}
			if (selectedDataOnLayer.size === 0) 
				this.selectedData.delete(layer);
			finalCallback && finalCallback();
			this.emit('unselected-all', layer);
		}
	}

	apply_on_selected(layer, eachCallback, finalCallback) {
		// const that = this;
		this.selectedData.forEach((selectedData, layer) => {
			selectedData.forEach((hash) => {
				var datum = layer.get_datum(hash);
				eachCallback && eachCallback(datum);
			});
		});
		finalCallback && finalCallback();
	}

	count_selected(layer) {
		var selectedDataOnLayer = this.selectedData.get(layer);
		if (selectedDataOnLayer) 
			return selectedDataOnLayer.size;
		return 0;
	}

}