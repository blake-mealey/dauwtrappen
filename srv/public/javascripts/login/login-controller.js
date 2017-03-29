$(document).ready(function () {
	console.log("Hello, world!");
	console.log("Testing");
});



function loggingIn()
{
//	$("#aButton").val($("#fName").val());
	
	$.get("/data/login", {email: $("#email").val(), password: $("#password").val()},function (data)
	{
		$("#emailTF").text("Email: ");
		$("#passwordTF").text("Password: ");
		if(data)
		{
			$("#emailTF").val("Email: Valid Login");
		}
		else
		{
			$("#emailTF").val("Email: Invalid Login");
		}
	});
	
}




function createAccount()
{
	$.get("/data/createAccount", {email: $("#email").val(), password: $("#password").val()},function (data)
	{
		$("#emailTF").text("Email: ");
		$("#passwordTF").text("Password: ");
		
		if(data == "IEE")
		{
			$("#emailTF").text("Email: Invalid Email Entered");
		}
		else if(data == "IPE")
		{
			$("#passwordTF").text("Email: Invalid Password Entered");
		}
		else if(data == "EIU")
		{
			$("#emailTF").text("Email: Email In Use");
		}
		else if(data == "AC")
		{
			$("#emailTF").text("Email: Account Created");
		}
	});
	
}

