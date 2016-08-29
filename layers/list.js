'use strict'

class List {

	constructor(propertyName) { 
		this.firstEl = undefined;
		this.lastEl = undefined;
		this.size = 0;
		this.propertyName = propertyName || ("safkListNextEl" + List.counter++)
	}

	pop() {
		if (this.firstEl) {
			let el = this.firstEl;
			this.firstEl = this.firstEl[this.propertyName];
			if (this.firstEl === undefined)
				this.lastEl = undefined;
			delete el[this.propertyName];
			this.size--;
			return el;
		}
		return undefined;
	}

	push(el) {
		if (!this.firstEl) {
			this.firstEl = this.lastEl = el;
			el[this.propertyName] = undefined;
		} else if (this.lastEl) {
			this.lastEl[this.propertyName] = el;
			this.lastEl = el;
			el[this.propertyName] = undefined;
		} else {
			this.firstEl = this.lastEl = el;
			el[this.propertyName] = undefined;
		}
		this.size++;
	}

	clear() {
		while (this.size) 
			this.pop();
	}
	
}

List.counter = 0;