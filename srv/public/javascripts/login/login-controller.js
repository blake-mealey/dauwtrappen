$(document).ready(function () {
	console.log("Hello, world!");
	console.log("Testing");
});



function changeName()
{
//	$("#aButton").val($("#fName").val());
	
	$.get("/data/userExists", {email: $("#fName").val(), password: $("#lName").val()},function (data)
	{
		if(data)
			$("#aButton").val("I EXIST");
		else
			$("#aButton").val("I DONT EXIST");
	});
	
}



