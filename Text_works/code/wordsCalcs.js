inlets = 1;
outlets = 2;
autowatch = 1;

/// Array to store all the words off the text
var myWords= [];

function list()
{
	
	//push the words of every incoming list to the array
	var a = arrayfromargs(arguments);
	for(var i=0;i<a.length;i++){
		myWords.push(a[i]);
		}		
}

function bang(){
	// on bang , spit through 2nd inlet the length of the current stored array
	outlet(1,"length",myWords.length);
	
	}
	
function clear(){
	
		myWords.length = 0; //clear the array - restart
	
}
	
function msg_int(x){
   var showWord = myWords[x]; //Show words stored and output 
   outlet(0,showWord);
}
