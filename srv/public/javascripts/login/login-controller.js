$(document).ready(function () {
	console.log("Hello, world!");
	console.log("Testing");
});



function changeName()
{
/*
	if(document.getElementById('aButton').value == "nope"){
		$("#aButton").val("yeah");
	}
	else{
		$("#aButton").val("nope");
	}
*/
	$("#aButton").val($("#fName").val());
	
}



