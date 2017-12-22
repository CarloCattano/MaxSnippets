autowatch = 1;
inlets = 1;
outlets = 8;

var jsuiWidth = 400;
var jsuiHeight = 400;

var nodeSize = 0.2;
var selectedNode = 0;

var m = mgraphics;

m.init();
m.relative_coords = 1;
m.autorefill = 0;

var numNodes = 8; // Changing this will require fiddling 
// with reset positions and node sizes...probably leave it at 8
var nodesX = [];
var nodesY = [];
var nodesColorR = [0.3, 1.0, 0.0, 0.0, 0.0, 0.0, 0.3, 1.0];
var nodesColorG = [0.0, 0.0, 0.3, 1.0, 0.0, 0.0, 0.0, 0.0];
var nodesColorB = [0.0, 0.0, 0.0, 0.0, 0.3, 1.0, 0.3, 1.0];

resetNodes();


m.redraw();

function onclick(x, y) {
	nodesX[selectedNode] = ((x / jsuiWidth) * 2 - 1) - (nodeSize * 0.5);
	nodesY[selectedNode] = (((y / jsuiHeight) * 2 - 1) * -1) + (nodeSize * 0.5);
	m.redraw();
	output();
}

function ondrag(x, y) {
	nodesX[selectedNode] = ((x / jsuiWidth) * 2 - 1) - (nodeSize * 0.5);
	nodesY[selectedNode] = (((y / jsuiHeight) * 2 - 1) * -1) + (nodeSize * 0.5);
	m.redraw();
	output();
}

function output() {
	for (var i = 0; i < numNodes; i++) {
		var tempCoords = [nodesX[i], nodesY[i]];
		outlet(i, tempCoords);
	}
}

function selectNode(n) {
	selectedNode = n;
}	

function paint() {
	for (var i = 0; i < numNodes; i++) {
		m.set_source_rgba(nodesColorR[i], nodesColorG[i], nodesColorB[i], 0.5);
		m.ellipse(nodesX[i], nodesY[i], nodeSize, nodeSize);
		m.fill();
	}
}

function bang() {
	resetNodes();
}

function resetNodes() {
	for (var i = 0; i < numNodes; i++) {
		nodesX[i] = -0.9 + (i * 0.225);
		nodesY[i] = 0.0 + (nodeSize * 0.5);
		m.redraw();
	}	
}	