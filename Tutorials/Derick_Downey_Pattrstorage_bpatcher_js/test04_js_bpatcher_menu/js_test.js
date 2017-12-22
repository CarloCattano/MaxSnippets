/* ----------------VARIABLES---------------- */


// Maximum number of bpatchers
var maxBpatchers = 16;

//Current number of bpatchers
var numBpatchers = 0;

//
var bpatcherSize = 100;

// Last numBpatcher amount (to compare for deletion)
var oldNumBpatcher = 0;



/* ----------------FUNCTIONS---------------- */

function create(t) {

	// Clamps to a reasonable range (0 to 10)
	if (t < 0) t = 0;
	if (t > maxBpatchers) t = maxBpatchers;
	
	// numbpatcher = incoming value (as "t")
	numBpatchers = t;
	
	// Delete old bpatchers
	for (var i=0; i<maxBpatchers; i++){
		if (i >= numBpatchers) {
			var oldBpatcher = this.patcher.getnamed("bpatcher"+i);
			this.patcher.remove(oldBpatcher);
		}
		
	}
	
	//Initialize semi-global variables for bpatcher position
	var xpos = 100; //starting x point (leftmost)
	var ypos = 250; //starting y point (topmost)
	
	var xposrate = 1; //rate of xposition change
	var yposrate = 150; //rate of xposition change
	
	// Create the bpatchers
	for (var i=0; i<maxBpatchers; i++){
		
		if (i < numBpatchers) {
		
			//create new bpatcher
			//newdefault = x position, y position, object name, arguments.
			var newBpatcher = this.patcher.newdefault(xpos, ypos, "bpatcher", "1brcosa.maxpat");

			//change size of bpatcher
			newBpatcher.rect = new Array(xpos+(i*xposrate), ypos+(i*yposrate), xpos + 300, ypos+(i*yposrate)+85);
			//outlet(0, i);
		

			//		this.patcher.message("script", "sendbox", foo, "patching_position", 20, 10);
		
			//newBpatcher.size = 
			// Create the bpatcher — [object name], [x position], [y position], [size], [0??]
			// var newBpatcher = this.patcher.newobject("toggle", xpos, ypos, bpatcherSize, 0);
			//var newBpatcher = this.patcher.newobject("bpatcher", xpos, 200+ypos*i, bpatcherSize, "circle_sequencer.maxpat");

		
			// Give scripting name to this new bpatcher
			newBpatcher.varname = "bpatcher"+i;
			
//			var mainMovie0 = this.patcher.get
//			this.patcher.hiddenconnect(mainMovie0,0, "bpatcher"+i,0);
		}
	}	

	oldNumBpatchers = numBpatchers;

}