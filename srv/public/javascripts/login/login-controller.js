$(document).ready(function () {
	console.log("Hello, world!");
	console.log("Testing");
});



function loggingIn()
{
//	$("#aButton").val($("#fName").val());
	
	$.get("/data/login", {email: $("#email").val(), password: $("#password").val()},function (data)
	{
		if(data)
		{
			$("#login").val("I EXIST");
		}
		else
		{
			$("#login").val("I DONT EXIST");
		}
	});
	
}




function createAccount()
{
	$.get("/data/createAccount", {email: $("#email").val(), password: $("#password").val()},function (data)
	{
		if(data == "IEE")
		{
			$("#create").val("Invalid Email Entered");
		}
		else if(data == "IPE")
		{
			$("#create").val("Invalid Password Entered");
		}
		else if(data == "EIU")
		{
			$("#create").val("Email In Use");
		}
		else if(data == "AC")
		{
			$("#create").val("Account Created");
		}
	});
	
}

