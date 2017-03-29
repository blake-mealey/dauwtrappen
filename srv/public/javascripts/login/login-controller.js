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
		if(data == "NE")
		{
			$("#emailTF").text("Email: No email entered");
		}
		else if(data == "NP")
		{
			$("#passwordTF").text("Password: No password entered");
		}
		else if(data == "ILI")
		{
			$("#emailTF").text("Email: Wrong Email or Password");
		}
		else if(data == "LI")
		{
			$("#emailTF").text("Email: Logging In");
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
			$("#passwordTF").text("Password: Invalid Password Entered");
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

