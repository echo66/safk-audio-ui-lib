'use strict'

class List {

	constructor(propertyPrefix) { 
		this.firstEl = undefined;
		this.lastEl = undefined;
		this.size = 0;

		if (propertyPrefix) {
			this.prevPropertyName = propertyPrefix + "PrevEl";
			this.nextPropertyName = propertyPrefix + "NextEl";
		} else {
			var i = List.counter++;
			this.prevPropertyName = List.defaultPrefix + "" + i + "" + "PrevEl";
			this.nextPropertyName = List.defaultPrefix + "" + i + "" + "NextEl";
		}
	}

	get first() {
		return this.firstEl;
	}

	get last() {
		return this.lastEl;
	}

	remove(el) {
		if (el && this.has(el)) {
			if (el === this.firstEl) {
				this.remove_first();
			} else if (el === this.lastEl) {
				this.remove_last();
			} else {
				var prev 		= el[this.prevPropertyName];
				var next 		= el[this.nextPropertyName];
				prev[this.nextPropertyName] = next;
				next[this.prevPropertyName] = prev;
				delete el[this.nextPropertyName];
				delete el[this.prevPropertyName];
			}
			this.size--;
		}
	}

	remove_first() {
		if (this.size) {
			let el = this.firstEl;
			this.firstEl = this.firstEl[this.nextPropertyName];
			if (this.firstEl === undefined)
				this.lastEl = undefined;
			delete el[this.nextPropertyName];
			this.size--;
			return el;
		}
		return undefined;
	}

	remove_last() {
		if (this.size) {
			let el = this.lastEl;
			if (this.firstEl === el) {	
				this.firstEl = this.lastEl = undefined;
			} else {
				this.lastEl = el[this.prevPropertyName];
				this.lastEl[this.nextPropertyName] = undefined;
			}
			delete el[this.nextPropertyName];
			delete el[this.prevPropertyName];
			this.size--;
			return el;
		}
		return undefined;
	}

	pop() {
		return this.remove_first();
	}

	push(el, canChangePlace = false) {
		this.insert_as_last(el, canChangePlace);
	}

	insert_as_first(el, canChangePlace = false) {
		if (el) {
			if (this.has(el)) {
				if (canChangePlace) 
					this.remove(el);
				else 
					return;
			} 

			if (!this.firstEl) {
				this.firstEl = this.lastEl = el;
				el[this.prevPropertyName] = undefined;
				el[this.nextPropertyName] = undefined;
			} else {
				this.firstEl[this.prevPropertyName] = el;
				el[this.prevPropertyName] = undefined;
				el[this.nextPropertyName] = this.firstEl;
				this.firstEl = el;
			}

			this.size++;
		}
	}

	insert_as_last(el, canChangePlace = false) {
		if (el) {
			if (this.has(el)) {
				if (canChangePlace) 
					this.remove(el);
				else 
					return;
			} 

			if (!this.firstEl) {
				this.firstEl = this.lastEl = el;
				el[this.prevPropertyName] = undefined;
				el[this.nextPropertyName] = undefined;
			} else if (this.lastEl) {
				el[this.prevPropertyName] = this.lastEl;
				this.lastEl[this.nextPropertyName] = el;
				this.lastEl = el;
				el[this.nextPropertyName] = undefined;
			} else {
				throw new Error('does not make sense o.O');
				// this.firstEl = this.lastEl = el;
				// el[this.prevPropertyName] = undefined;
				// el[this.nextPropertyName] = undefined;
			}

			this.size++;
		}
	}

	clear() {
		while (this.size) 
			this.pop();
	}

	has(el) {
		return el && (this.nextPropertyName in el) && (this.prevPropertyName in el);
	}

	iterator() {
		const that = this;
		return {
			el: that.firstEl, 
			entry: { value: undefined, done: false }, 
			next: function() {
				if (this.el) {
					this.entry.value = this.el;
					this.entry.done = false;
					this.el = this.el[that.nextPropertyName];
				} else {
					this.entry.value = undefined;
					this.entry.done = true;
				}
				return this.entry;
			}
		}
	}
	
}

List.counter = 0;

List.defaultPointerPropertiesPrefix = 'safkList';