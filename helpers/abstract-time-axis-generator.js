'use strict'

class AbstractTimeAxisGenerator {
	constructor() {
		this._ = {};
		this._.itData = {
			layer: undefined, 
			currentTime: undefined, 
			startTime: undefined, 
			endTime: undefined, 
			// timeStep: undefined, 
			timeDomain: undefined, 
			entry: { 
				value: undefined, 
				done: undefined 
			}, 
			nextValue: { 
				time: undefined, 

				text: undefined, 
				textOffsetX: undefined, 
				textOffsetY: undefined, 
				fontColor: undefined, 
				fontSize: undefined, 
				fontFamily: undefined, 
				textOpacity: undefined, 

				tickWidth: undefined, 
				tickHeight: undefined, 
				tickOpacity: undefined, 
				tickColor: undefined
				
			}
		};
	}

	next_time(t0, currentTime, t1, layer) {
		throw new Error('not implemented');
	}

	// time_step(t0, t1, layer) {
	// 	throw new Error('not implemented');
	// }

	start_time(t0, t1, layer) {
		return t0;
	}

	end_time(t0, t1, layer) {
		return t1;
	}

	text(time, layer) {
		throw new Error('not implemented');
	}

	textOffset(time, layer, axis) {
		throw new Error('not implemented');
	}

	fontColor(time, layer) {
		throw new Error('not implemented');
	}

	fontSize(time, layer) {
		throw new Error('not implemented');
	}

	fontFamily(time, layer) {
		throw new Error('not implemented');
	}

	textOpacity(time, layer) {
		throw new Error('not implemented');
	}

	tickWidth(time, layer) {
		throw new Error('not implemented');	
	}

	tickHeight(time, layer) {
		throw new Error('not implemented');	
	}

	tickColor(time, layer) {
		throw new Error('not implemented');	
	}

	tickOpacity(time, layer) {
		throw new Error('not implemented');	
	}

	start(layer) {
		var _ = this._.itData;
		_.layer = layer;
		_.timeDomain = layer.timeDomain;
		_.startTime = _.currentTime = this.start_time(_.timeDomain[0], _.timeDomain[1]);
		_.endTime = this.end_time(_.timeDomain[0], _.timeDomain[1]);
		// _.timeStep = this.time_step(_.currentTime, _.endTime);
	}

	next() {
		var _ = this._.itData;

		if (_.currentTime > _.timeDomain[1]) {

			_.entry.value = undefined;
			_.entry.done = true;

		} else {

			_.nextValue.time = _.currentTime; 

			var t = _.nextValue.time;

			_.nextValue.text = this.text(t, _.layer); 
			_.nextValue.textOffsetX = this.textOffset(t, _.layer, 'x'); 
			_.nextValue.textOffsetY = this.textOffset(t, _.layer, 'y'); 
			_.nextValue.fontColor = this.fontColor(t, _.layer); 
			_.nextValue.fontSize = this.fontSize(t, _.layer); 
			_.nextValue.fontFamily = this.fontFamily(t, _.layer); 
			_.nextValue.textOpacity = this.textOpacity(t, _.layer); 

			_.nextValue.tickWidth = this.tickWidth(t, _.layer); 
			_.nextValue.tickHeight = this.tickHeight(t, _.layer); 
			_.nextValue.tickColor = this.tickColor(t, _.layer);
			_.nextValue.tickOpacity = this.tickOpacity(t, _.layer); 

			_.entry.value = _.nextValue;
			_.entry.done = false;

			// _.currentTime += _.timeStep;
			_.currentTime = this.next_time(_.startTime, _.currentTime, _.endTime, _.layer);

		}

		return _.entry;
	}

	stop() {
		var _ = this._.itData;
		_.layer = undefined;
		_.timeDomain = undefined;
		_.currentTime = undefined;
		_.startTime = undefined;
		_.endTime = undefined;
		// _.timeStep = undefined;
		_.entry.value = undefined;
		_.entry.done = undefined;
		_.nextValue.time = undefined; 
		_.nextValue.color = undefined; 
		_.nextValue.width = undefined; 
		_.nextValue.height = undefined; 
		_.nextValue.text = undefined;
		_.nextValue.textOffset = undefined;
	}
}