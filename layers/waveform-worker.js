importScripts('../pnglib.js');
importScripts('../linear-scale.js');

function lineTo(x0, y0, x1, y1, p) {
	var dx = x1 - x0
	var dy = y1 - y0
	var D = dy - dx
	var y = y0 
	var step = dx * 0.01;

	for (var x=x0; x<x1; x++) {
		p.buffer[p.index(Math.floor(x), Math.floor(y))] = p.color(0, 0, 0);
		if (D >= 0) {
			y = y + 1;
			D = D - dx;
		}
		D = D + dy;
	}
}

onmessage = function(e) {
	console.log(e);
	var bufferStart = e.data.bufferStart;
	var bufferEnd = e.data.bufferEnd;

	var il = new Float32Array(e.data.arrayBuffer);

	var numSamples = bufferEnd - bufferStart;
	var width = Math.min(e.data.waveformMaxDetail, numSamples);
	var height = e.data.height;
	var numPixels  = width;

	var pixelStep = numPixels / numSamples;

	var waveformValueToPixel = linear().domain([-1, 1]).range([0, height]);

	var p = new PNGlib(width, height, 256);
	var background = p.color(0, 0, 0, 0);

	var pX = 0, 
		pY = 0;

	for (var i = bufferStart; i <= bufferEnd; i++) {
		var valAm = il[i];
		var valPx = waveformValueToPixel(valAm);
		lineTo(pX, pY, pX + pixelStep, valPx, p);
		pX += pixelStep;
		pY = valPx;
	}

	self.postMessage({
		messageId: e.data.messageId, 
		dataURL: 'data:image/png;base64,' + p.getBase64()
	}, [e.data.arrayBuffer]);
}
