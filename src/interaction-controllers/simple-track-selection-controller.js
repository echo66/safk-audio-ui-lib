'use strict'

import { EventEmitter } from '../utils/event-emitter.js';
import { SimpleDragAndCreateTrackAreaController } from './simple-drag-and-create-track-area-controller.js';

class SimpleTrackSelectionController extends SimpleDragAndCreateTrackAreaController {

	constructor(params) {
		super(params);

		this._.selectionManager = params.selectionManager;

		this._.toggleSelection = (params.toggleSelection !== undefined)? 
															params.toggleSelection 
															: false;

		this._.checkSelectionOnlyAtEnd = (params.checkSelectionOnlyAtEnd !== undefined)? 
															params.checkSelectionOnlyAtEnd 
															: true;

		const that = this;
	}

	check_selection_area(area, e) {
		var layersIt = this.track.layers;
		var entry1 = layersIt.next();
		var layer = entry1.value;

		while (!entry1.done) {

			if (!this.toggleSelection) {
				this.selectionManager.unselect_all(layer);
				layer.update();
			}

			var elementsIt = layer.elements;
			var entry2 = elementsIt.next();
			var $el = entry2.value;

			while (!entry2.done) {

				if (this.can_select(area, layer, $el, e)) {
					var datum = layer.get_datum_from_element($el);
					if (datum !== undefined) {
						if (this.selectionManager.is_selected(layer, datum)) {
							this.selectionManager.unselect(layer, datum);
						} else {
							this.selectionManager.select(layer, datum);
						}
						layer.set(datum);
					}
				} 

				entry2 = elementsIt.next();
				$el = entry2.value;
			}

			entry1 = layersIt.next();
			layer = entry1.value;
		}
	}

	single_touch_selection(e) {
		/*
			I created the 'pos' object to make it simpler, for me, to test other coordinate pairs.
		 */
		var pos = {
			x: e.x, 
			y: e.y
		};

		var elements = document.elementsFromPoint(pos.x, pos.y);
		var targetLayer, targetDatum;

		for (var i=0; i<elements.length; i++) {
			var $el = elements[i];
			targetLayer = this.track.get_element_layer($el);
			if (targetLayer) {
				targetDatum = targetLayer.get_datum_from_element($el);
				break;
			}
		}

		var layersIt = this.track.layers;

		var entry = layersIt.next();
		var layer = entry.value;

		while (!entry.done) {
			var isSameLayer = (targetLayer === layer);
			var hasToggleSelection = this.toggleSelection;
			var datumIsSelected = (targetDatum !== undefined) 
									&& (targetDatum !== null) 
									&& this.selectionManager.is_selected(layer, targetDatum);

			if (!isSameLayer && !hasToggleSelection) {
				selectionManager.unselect_all(layer);
			}

			if (isSameLayer && hasToggleSelection && datumIsSelected){
				this.selectionManager.unselect(layer, targetDatum);
			}

			if (isSameLayer && hasToggleSelection && !datumIsSelected) {
				this.selectionManager.select(layer, targetDatum);
			}

			if (isSameLayer && !hasToggleSelection) {
				this.selectionManager.unselect_all(layer);
				this.selectionManager.select(layer, targetDatum);
			}

			// layer.update();

			entry = layersIt.next();
			layer = entry.value;
		}

		this.track.update();
	}

	can_select(area, layer, $el, e) {
		/* 
			Like 'set_area' method, this one can be reimplemented aswell. 
		*/
		var offset = Number(layer.interactionsDomEl.style.left.substring(0, layer.interactionsDomEl.style.left.length-2));
		var left  = Number($el.style.left.substring(0, $el.style.left.length-2)) + offset;
		var width = Number($el.style.width.substring(0, $el.style.width.length-2));

		return area.x <= left && area.x + area.width >= left + width;
	}

	on_drag_start(area, e) {
		this.set_area(area, e);
		this._.lastMethod = 'on_drag_start';
	}

	on_drag(area, e) {
		this.set_area(area, e);
		if (!this.checkSelectionOnlyAtEnd) 
			this.check_selection_area(area, e);
		this._.lastMethod = 'on_drag';
	}

	on_drag_end(area, e) {
		this.set_area(area, e); 
		if (this._.lastMethod === 'on_drag_start') 
			this.single_touch_selection(e);
		else	
			this.check_selection_area(area, e);
		this._.lastMethod = 'on_drag_end';
	}

	set_area(area, e) { 
		/* 
			The programmer should reimplement this method if, 
			for exameple, one desires to implement a 'snap 
			to grid' behavior. 
		*/ 
	}

	get checkSelectionOnlyAtEnd() {
		return this._.checkSelectionOnlyAtEnd;
	}

	set checkSelectionOnlyAtEnd(v) {
		this._.checkSelectionOnlyAtEnd = v;
	}

	get toggleSelection() {
		return this._.toggleSelection;
	}

	set toggleSelection(v) {
		this._.toggleSelection = v;
	} 

	get selectionManager() {
		return this._.selectionManager;
	}
}

export { SimpleTrackSelectionController };