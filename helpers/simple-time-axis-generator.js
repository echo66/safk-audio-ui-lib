'use strict'

class SimpleTimeAxisGenerator extends AbstractTimeAxisGenerator {
	constructor(params) {

		params = params || {};

		super(params);

		this._.numberOfTicks = params.numberOfTicks || 10;

	}

	next_time(t0, currentTime, t1, layer) {
		return currentTime + this._.timeStep;
	}

	text(time, layer) {
		return time + '';
	}

	textOffset(time, layer, axis) {
		return 2;
	}

	fontColor(time, layer) {
		return 'black';
	}

	fontSize(time, layer) {
		return 5;
	}

	fontFamily(time, layer) {
		return 'Verdana';
	}

	textOpacity(time, layer) {
		return 1;
	}

	tickWidth(time, layer) {
		return 2;
	}

	tickHeight(time, layer) {
		return layer.height;
	}

	tickColor(time, layer) {
		return 'black';
	}

	tickOpacity(time, layer) {
		return 1;
	}

	start(layer) {
		super.start(layer);
		this._.timeStep = (this._.itData.endTime - this._.itData.startTime) / this._.numberOfTicks;
	}

	get numberOfTicks() {
		return this._.numberOfTicks;
	}

	set numberOfTicks(v) {
		this._.numberOfTicks = v;
	}
}