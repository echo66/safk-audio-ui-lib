'use strict';

// https://gist.github.com/electricg/4435259
// Which HTML element is the target of the event
var mouseTarget = function(e) {
	var targ;
	if (!e) var e = window.event;
	if (e.target) targ = e.target;
	else if (e.srcElement) targ = e.srcElement;
	if (targ.nodeType == 3) // defeat Safari bug
		targ = targ.parentNode;
	return targ;
}
 
// Mouse position relative to the document
// From http://www.quirksmode.org/js/events_properties.html
var mousePositionDocument = function(e) {
	var posx = 0;
	var posy = 0;
	if (!e) {
		var e = window.event;
	}
	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	}
	else if (e.clientX || e.clientY) {
		posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}
	return {
		x : posx,
		y : posy
	};
}

// Find out where an element is on the page
// From http://www.quirksmode.org/js/findpos.html
var findPos = function(obj) {
	var curleft = 0;
	var curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return {
		left : curleft,
		top : curtop
	};
}
 
// Mouse position relative to the element
// not working on IE7 and below
var mousePositionElement = function(e) {
	var mousePosDoc = mousePositionDocument(e);
	var target = mouseTarget(e);
	var targetPos = findPos(target);
	var posx = mousePosDoc.x - targetPos.left;
	var posy = mousePosDoc.y - targetPos.top;
	return {
		x : posx,
		y : posy
	};
};

var getAbsolutePosition = function(element) {
	var r = { x: element.offsetLeft, y: element.offsetTop };
	if (element.offsetParent) {
		var tmp = getAbsolutePosition(element.offsetParent);
		r.x += tmp.x;
		r.y += tmp.y;
	}
	return r;
};

/**
* Retrieve the coordinates of the given event relative to the center
* of the widget.
*
* @param event
*   A mouse-related DOM event.
* @param reference
*   A DOM element whose position we want to transform the mouse coordinates to.
* @return
*    A hash containing keys 'x' and 'y'.
*/
var getRelativeCoordinates = function(event, reference) {
	var x, y;
	event = event || window.event;
	var el = event.target || event.srcElement;

	if (!window.opera && typeof event.offsetX != 'undefined') {
		// Use offset coordinates and find common offsetParent
		var pos = { x: event.offsetX, y: event.offsetY };

		// Send the coordinates upwards through the offsetParent chain.
		var e = el;
		while (e) {
			e.mouseX = pos.x;
			e.mouseY = pos.y;
			pos.x += e.offsetLeft;
			pos.y += e.offsetTop;
			e = e.offsetParent;
		}

		// Look for the coordinates starting from the reference element.
		var e = reference;
		var offset = { x: 0, y: 0 }
		while (e) {
			if (typeof e.mouseX != 'undefined') {
				x = e.mouseX - offset.x;
				y = e.mouseY - offset.y;
				break;
			}
			offset.x += e.offsetLeft;
			offset.y += e.offsetTop;
			e = e.offsetParent;
		}

		// Reset stored coordinates
		e = el;
		while (e) {
			e.mouseX = undefined;
			e.mouseY = undefined;
			e = e.offsetParent;
		}
	} else {
		// Use absolute coordinates
		var pos = getAbsolutePosition(reference);
		x = event.pageX  - pos.x;
		y = event.pageY - pos.y;
	}
	// Subtract distance to middle
	return { x: x, y: y };
};

export { mouseTarget, mousePositionDocument, findPos, mousePositionElement, getRelativeCoordinates };