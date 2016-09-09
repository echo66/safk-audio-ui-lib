'use strict'

import { AbstractTimeAxisGenerator } from './abstract-time-axis-generator.js';

export class BarTimeAxisGenerator extends AbstractTimeAxisGenerator {
	constructor(params) {

		params = params || {};

		super(params);

		this._.beatsPerBar = params.beatsPerBar || 4;
	}

	start_time(t0, t1) {
		return Math.round(t0) - (Math.round(t0) % this._.beatsPerBar);
	}

	end_time(t0, t1) {
		// return Math.round(t1);
		return Math.round(t1) + (Math.round(t1) % this._.beatsPerBar);	
	}

	next_time(t0, currentTime, t1, layer) {
		return currentTime + this.beat_step(t0, currentTime, t1, this._.beatsPerBar);
	}

	beat_step(t0, currentTime, t1, beatsPerBar) {
		var numberOfBeats = t1 - t0;
		var numberOfBars = numberOfBeats / beatsPerBar;

		if (numberOfBars < beatsPerBar / 2) {
			return 0.25;
		} else if (numberOfBars < beatsPerBar) {
			return 0.5;
		} else if (numberOfBars < 4 * beatsPerBar) {
			return 1;
		}

		var i = 8;
		var j = 1;
		while (true) {
			if (numberOfBars < i * beatsPerBar) {
				return j * beatsPerBar;
			}
			i *= 2;
			j *= 2;
		}
	}

	text(time, layer) {
		return time + '';
	}

	textOffset(time, layer, axis) {
		return 2;
	}

	fontColor(time, layer) {
		return 'black';
		// return (this._.itData.isDownBeat)? 'red' : 'black';
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
		return (this._.itData.isDownBeat)? 2 : 1;
	}

	tickHeight(time, layer) {
		var floor = Math.floor(time);
		var ceil = Math.ceil(time);
		if (floor !== time && ceil !== time) 
			return layer.height / 3;
		else
			return (this._.itData.isDownBeat)? layer.height : (layer.height / 2);
	}

	tickColor(time, layer) {
		return (this._.itData.isDownBeat)? 'red' : 'black';
	}

	tickOpacity(time, layer) {
		return 1;
	}

	start(layer) {
		super.start(layer);
	}

	next() {
		this._.itData.isDownBeat = ((this._.itData.currentTime % this._.beatsPerBar) === 0);
		return super.next();
	}

	stop() {
		super.stop();
		this._.itData.isDownBeat = undefined;
	}

	get beatsPerBar() {
		return this._.beatsPerBar;
	}

	set beatsPerBar(v) {
		this._.beatsPerBar = v;
	}
}