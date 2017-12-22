/*
	By Nathan Greywater of HARMERGEDDON (www.harmergeddon.tv)
	Released into the wild 18/12/2017
	Free to use with attribution for non commercial purposes (Creative Commons Attribution-NonCommercial 4.0 International)
    get in touch via harmergeddontv@gmail.com for further licencing.
*/


'use strict';

autowatch = 1, inlets = 1, outlets = 1;

setinletassist(0, "setPosition n $1, setScale $1 $2, setBuf name, getLen");

var mouseMode = 0; //ignore click flag

var dims = [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]]; //jsui dimensions

var buf = new Buffer("test"); //reference buffer
var bufferLength = buf.length(); //buffer length in ms

var scale = [0, 1]; //start(scalar), length(scalar)

//playhead
var lineColour = [0.98, 0.12, 0.34, 1];
var lineWidth = 2;
var arrowSize = 30;
var position = [];

//selection
var selColour = [0, 0, 1, 0.3];
var startPos = 0; //start(scalar)
var endPos = 0; //length(scalar)
var selPosMs = [0, 100]; //start(ms) length(ms)
var absSelPos = [dims[0] * startPos, dims[0] * endPos]; //start(px) length(px)

//focusPoint
var markers = new Dict("markers");
var pointMarkers = [];
var selectedPoint = null;
var hoverPoint = null;
var hovStr;

//idle ghost
var idleColour = [0.5, 0.5, 0.5, 0.8];
var idleWidth = 1;
var idlePos = -1;

var outPos = [startPos * bufferLength, endPos * bufferLength]; //the ms position to output

//Draw arrows
var renderArrow = function (w, h, colours) {
    var mg = new MGraphics(w, h);
    var padding = w / 13.333;
    var lineSize = w / 10;
    var drawGrain = [w / 10, h / 10];

    // Draw Background
    mg.set_source_rgba([0, 0, 0, 0]);
    mg.rectangle(0, 0, w, h);
    mg.fill();

    // Draw Circle
    mg.set_line_width(padding);
    mg.ellipse(padding, padding, w - (padding * 2), h - (padding * 2));
    mg.set_source_rgba(colours);
    mg.fill();

    mg.set_source_rgba(colours);

    mg.set_line_width(lineSize);
    mg.set_line_cap('round');

    // Draw Arrow
	mg.set_source_rgba(0,0,0,0.2);
    mg.move_to(drawGrain[0] * 2, h / 2);
    mg.line_to(drawGrain[0] * 7, drawGrain[1] * 7);
    mg.move_to(drawGrain[0] * 2, h / 2);
    mg.line_to(drawGrain[0] * 7, drawGrain[1] * 3);
    mg.stroke();

    // Make image
    return new Image(mg);
};
renderArrow.local = 1;
var arrow = renderArrow(arrowSize, arrowSize, lineColour);
var drawLeft = false;
var drawRight = false;

var renderMarker = function(w, h, colours) {
	var mg = new MGraphics(w, h);
    // Draw Background
    mg.set_source_rgba([0, 0, 0, 0]);
    mg.rectangle(0, 0, w, h);
    mg.fill();	
    // Draw Marker
	mg.set_source_rgba(colours);
	mg.set_line_width(2);
	mg.move_to((w/2), 0);
	mg.line_to((w/2), dims[1] - (w/2));
	mg.stroke();

	mg.move_to((w/2), dims[1] - (w/2));
	mg.line_to((w/2) - (w/2), dims[1]);
	mg.move_to((w/2), dims[1] - (w/2));
	mg.line_to((w/2) + (w/2), dims[1]);
	mg.line_to((w/2) - (w/2), dims[1]);
	mg.stroke_preserve();
	mg.fill();

	return new Image(mg);
};
renderMarker.local = 1;
var markerUI = []
markerUI[0] = renderMarker(12, dims[1], [0.6, 0, 0, 1]);
markerUI[1] = renderMarker(12, dims[1], [0, 0, 0, 1]);

////////////////////////////////////////////////////////////////////
/////////////////////// Universal functions ////////////////////////
////////////////////////////////////////////////////////////////////

var clip = function(a, low, high) {
	a = a < low ? low : a;
	a = a > high ? high : a;
	return a;
};
clip.local = 1;

////////////////////////////////////////////////////////////////////
/////////////////////////// JSUI DRAWING ///////////////////////////
////////////////////////////////////////////////////////////////////

var m = mgraphics;
m.init();
m.relative_coords = 0;
m.autofill = 0;

var drawIdle = function() {
	m.set_source_rgba(idleColour);
	m.set_line_width(idleWidth);
	m.move_to(idlePos * dims[0], 0);
	m.line_to(idlePos * dims[0], dims[1]);
	m.stroke();
};
drawIdle.local = 1;

var drawSelection = function() {
	m.set_source_rgba(selColour);
	m.rectangle(absSelPos[0], 0, absSelPos[1], dims[1]);
	m.fill();
	m.set_line_width(1);
	m.move_to(absSelPos[0], 0);
	m.line_to(absSelPos[0], dims[1]);
	m.move_to(absSelPos[0] + absSelPos[1], 0);
	m.line_to(absSelPos[0] + absSelPos[1], dims[1]);
	m.stroke();
};
drawSelection.local = 1;

var drawPlayheads = function() {
	var i, len = position.length, lineShade = [];
	m.set_line_width(lineWidth);

	drawLeft = false, drawRight = false; //reset draw arrows to false before loop

    for(i = 0; i < len; i += 1) {
		//scale colours RGB based on number of playheads
		lineShade[0] = lineColour[0] * ((i + 1) / len);
		lineShade[1] = lineColour[1] * ((i + 1) / len);
		lineShade[2] = lineColour[2] * ((i + 1) / len);
		lineShade[3] = lineColour[3];
		//set colour
	    m.set_source_rgba(lineShade);
		//draw the lines
	    m.move_to(position[i], 0);
	    m.line_to(position[i], dims[1]);
		m.stroke();
		//if any playheads are off left then draw left arrow
		if(position[i] < 0) {
			drawLeft = true;
		}
		//if any playheads are off right then draw right arrow
		if(position[i] > dims[0]) {
			drawRight = true;
		}
    }
};
drawPlayheads.local = 1;

var drawArrows = function() {
	if(drawLeft) {
		m.identity_matrix();
		m.transform(1, 0, 0, 1, 0, (dims[1] * 0.5)-(arrowSize * 0.5));
		m.image_surface_draw(arrow);
		m.identity_matrix();
	}
	if(drawRight) {
		m.identity_matrix();
		m.transform(-1, 0, 0, 1, dims[0], (dims[1] * 0.5)-(arrowSize * 0.5));
		m.image_surface_draw(arrow);
		m.identity_matrix();
	}
};
drawArrows.local = 1;

var drawMarkers = function() {
	var i, len = pointMarkers.length;
	var drawingPos;
	var hovStrDims;

	m.set_source_rgba(0, 0, 0, 1);
	m.identity_matrix();
	m.transform(1, 0, 0, 1, ((((pointMarkers[0] / bufferLength) - scale[0]) / scale[1]) * dims[0])-6, 0);
	m.image_surface_draw(markerUI[0]);
	m.identity_matrix();

	for(i = 1; i < len; i += 1) {
		m.set_source_rgba(0, 0, 0, 1);
		m.identity_matrix();
		m.transform(1, 0, 0, 1, ((((pointMarkers[i] / bufferLength) - scale[0]) / scale[1]) * dims[0])-6, 0);
		m.image_surface_draw(markerUI[1]);
		m.identity_matrix();
	}

	if(mouseMode == 1 && hoverPoint !== null) {
		//if hover
		m.set_source_rgba(0, 0, 0, 0.5);
		m.ellipse(2, 2, 30, 30);
		m.fill();
		//display marker index
		m.set_source_rgba(1, 1, 1, 0.8);
		m.select_font_face("Arial", "normal", "normal");
		m.set_font_size(20);
		hovStrDims = m.text_measure(hovStr);
		m.move_to(17 - (hovStrDims[0] * 0.5), 2 + hovStrDims[1]);
		m.show_text(hovStr);
	}
};
drawMarkers.local = 1;

var paint = function() {
	drawIdle();
	drawSelection();
	drawMarkers();
	drawPlayheads();
	drawArrows();
};

////////////////////////////////////////////////////////////////////
///////////////////////////// Set vars /////////////////////////////
////////////////////////////////////////////////////////////////////

//set buffer to reference
var setBuf = function(v) {
	buf = new Buffer(v);
	bufferLength = buf.length();
};
//get the length of the referenced buffer
var getLen = function() {
	bufferLength = buf.length();
	//keep loop length seperate from bufferlength
	endPos = selPosMs[1] / bufferLength;
	absSelPos[1] = (endPos / scale[1]) * dims[0];
	m.redraw();
};

//0 is select loop //1 is allow click through to zoom
var setMouseMode = function(v) {
	switch(v) {
		case 0:
			mouseMode = 0;
			this.box.ignoreclick = 0;
			break;
		case 1:
			mouseMode = 1;
			this.box.ignoreclick = 0;
			break;
		case 2:
			mouseMode= 2;
			this.box.ignoreclick = 0;
		case 3:
			mouseMode = 3;
			this.box.ignoreclick = 1;
			break;
		default:
			mouseMode = 0;
			this.box.ignoreclick = 0;
	}
};

//set playhead positions
var setPosition = function(i, v) {
	position[i] = ((v - (scale[0])) / (scale[1])) * dims[0];
	m.redraw();
};

//zoom scale
var setScale = function(start, length) {
	scale[0] = start;
	scale[1] = length;

	//update selection
	absSelPos[0] = ((startPos - scale[0]) / scale[1]) * dims[0];
	absSelPos[1] = (endPos / scale[1]) * dims[0];
	m.redraw();
	notifyclients();
};

//loop length getter and setter
var getLoopLen = function() {
	return endPos;
};
var setLoopLen = function(v) {
	endPos = v;
	absSelPos[1] = (endPos / scale[1]) * dims[0];
	m.redraw();

	outPos[0] = startPos * bufferLength;
	outPos[1] = endPos * bufferLength;

	outlet(0, outPos);
};
//set loop len with MS from Max
var setLoopLenMs = function(v) {
	if(v > 0) {
		selPosMs[1] = v;
		endPos = selPosMs[1] / bufferLength;
		absSelPos[1] = (endPos / scale[1]) * dims[0];
		m.redraw();

		outPos[0] = startPos * bufferLength;
		outPos[1] = endPos * bufferLength;

		outlet(0, outPos);
		notifyclients();
	}
};

//loop start getter and setter
var getStartPos = function() {
	return startPos;
};
var setStartPos = function(x) {
	setSelPos(x);
};

var setSelPos = function(xPos) {
	startPos = (xPos * scale[1]) + scale[0];
	startPos = clip(startPos, 0., 1.);

	pointMarkers[0] = startPos * bufferLength;
	markers.set(0, (startPos * bufferLength));
	//(((pointMarkers[i] / bufferLength) - scale[0]) / scale[1]) * dims[0];

	absSelPos[0] = ((startPos - scale[0]) / scale[1]) * dims[0];
	absSelPos[1] = (endPos / scale[1]) * dims[0];

	m.redraw();

	outPos[0] = startPos * bufferLength;
	outPos[1] = endPos * bufferLength;

	outlet(0, outPos);
	notifyclients();
};
setSelPos.local = 1;

var searchForPoint = function(len, relX) {
	var i, relPos, relX, addPoint;

	if(len > 1) {
		for(i = 1; i < len; i += 1) {
			relPos = markers.get(i) / bufferLength;
			if(Math.abs(relPos - relX) < (0.01 * scale[1])) {
				addPoint = i;
				break;
			} else {
				addPoint = null;
			}
		}
	} else {
		addPoint = null;
	}
	return addPoint;
};
searchForPoint.local = 1;

var setMarker = function(xPos, shift) {
	var len = pointMarkers.length;
	var i;
	var relativeX = (xPos * scale[1]) + scale[0];
	var clickedPoint = searchForPoint(len, relativeX);

	if(shift) {
		pointMarkers.splice(clickedPoint, 1);
		toDict();
	} else {
		if(clickedPoint === null) {
			pointMarkers[len] = relativeX * bufferLength;
			toDict();
		}
	}
};
setMarker.local = 1;

var getMarker = function(v) {
	if(markers.contains(v)) {
		setSelPos((markers.get(v) / bufferLength));
	}
};

var dragMarkers = function(xPos, but) {
	if(but) {
		var i, len = pointMarkers.length;
		var relativeX = (xPos * scale[1]) + scale[0];
		if(selectedPoint === null) {
			selectedPoint = searchForPoint(len, relativeX);
		} else {
			pointMarkers[selectedPoint] = relativeX * bufferLength;
			m.redraw();
		}
	} else {
		if(selectedPoint !== null) {
			markers.set(selectedPoint, pointMarkers[selectedPoint]);
		}
		selectedPoint = null;
	}
};
dragMarkers.local = 1;

var clearMarkers = function() {
	pointMarkers = [];
	markers.clear();
};

var fromDict = function() {
	var i, len, keys;

	keys = markers.getkeys();

	if(keys === null) {
		return;
	} else {
		len = keys.length;
	}

	for(i = 0; i < len; i += 1) {
		pointMarkers[i] = markers.get(i);
	}
	m.redraw();
};

var toDict = function() {
	var i, len = pointMarkers.length;
	markers.clear();
	for(i = 0; i < len; i += 1){
		markers.replace(i, pointMarkers[i]);
	}
};
toDict.local = 1;

////////////////////////////////////////////////////////////////////
//////////////////////// Mousing functions /////////////////////////
////////////////////////////////////////////////////////////////////

//set new loop point
var onclick = function(x, y, but, mod1, shift) {
	switch(mouseMode) {
		case 0:
			setSelPos(x/dims[0]);
			break;
		case 1:
			setMarker(x/dims[0], shift);
			break;
		case 2:
			//set region
			break;
		default:
			setSelPos(x/dims[0]);
	}

	ondrag(x, y, but, mod1, shift);
};
onclick.local = 1;

//set new loop point
var ondrag = function(x, y, but, mod1, shift) {
	switch(mouseMode) {
		case 0:
			setSelPos(x/dims[0]);
			break;
		case 1:
			dragMarkers(x/dims[0], but);
			break;
		case 2:
			//range selection
			break;
		default:
			setSelPos(x/dims[0]);
	}

	//on release redraw idlepos
	if(!but) {
		idlePos = x / dims[0];
		if(mouseMode == 0) {
			var markerPos = ((idlePos * scale[1]) + scale[0]) * bufferLength;
			markerPos = clip(markerPos, 0, bufferLength);
			pointMarkers[0] = markerPos;
			markers.set(0, markerPos);
		}
		m.redraw();
	}
};
ondrag.local = 1;

//set ghost bar
var onidle = function(x) {
	if(mouseMode == 1) {
		var len = pointMarkers.length;
		var i;
		var relativeX = ((x/dims[0]) * scale[1]) + scale[0];
		hoverPoint = searchForPoint(len, relativeX);
		if(hoverPoint !== null) {
			hovStr = hoverPoint.toString();
		}
	}

	idlePos = x / dims[0];
	m.redraw();
};
onidle.local = 1;

var onidleout = function() {
	idlePos = -1;
	hoverPoint = null;
	m.redraw();
};
onidleout.local = 1;

//get position and size if changed
var onresize = function() {
	dims = [box.rect[2] - box.rect[0], box.rect[3] - box.rect[1]];
};
onresize.local = 1;

////////////////////////////////////////////////////////////////////
////////////////////// Get Set draw params /////////////////////////
////////////////////////////////////////////////////////////////////

var getLineColour = function() {
	return lineColour;
};

var setLineColour = function(r, g, b, a) {
	lineColour = [r, g, b, a];
	m.redraw();
};

var getLineWidth = function() {
	return lineWidth;
};

var setLineWidth = function(v) {
	lineWidth = v;
	m.redraw();
};

var getSelColour = function() {
	return selColour;
};

var setSelColour = function(r, g, b, a) {
	selColour = [r, g, b, a];
	m.redraw();
};

var getIdleColour = function() {
	return idleColour;
};

var setIdleColour = function(r, g, b, a) {
	idleColour = [r, g, b, a];
	m.redraw();
};

var getIdleWidth = function() {
	return idleWidth;
};

var setIdleWidth = function(v) {
	idleWidth = v;
	m.redraw();
};

////////////////////////////////////////////////////////////////////
/////////////////////// PattrStuff ////////////////////////
////////////////////////////////////////////////////////////////////

declareattribute("startPos", "getStartPos", "setStartPos", 1);
declareattribute("endPos", "getLoopLen", "setLoopLen", 1);
declareattribute("lineColour", "getLineColour", "setLineColour", 1);
declareattribute("lineWidth", "getLineWidth", "setLineWidth", 1);
declareattribute("selColour", "getSelColour", "setSelColour", 1);
declareattribute("idleColour", "getIdleColour", "setIdleColour", 1);
declareattribute("idleWidth", "getIdleWidth", "setIdleWidth", 1);

var getvalueof = function() {
	var getArray = [startPos, endPos];
	return getArray;
};

var setvalueof = function() {
	var argArr = arrayfromargs(arguments);
	setStartPos((argArr[0] / scale[1]) - (scale[0] / scale[1]));
	setLoopLen(argArr[1]);
};