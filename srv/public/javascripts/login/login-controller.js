$(document).ready(function () {
	console.log("Hello, world!");
	console.log("Testing");
});



function loggingIn()
{
//	$("#aButton").val($("#fName").val());
	
	$.get("/data/login", {email: $("#email").val(), password: $("#password").val()},function (data)
	{
		$("#emailTF").text("");
		$("#emailTF").css("color","#ff0000");
		if(data == "NE")
		{
			$("#emailTF").text("No email entered");
		}
		else if(data == "NP")
		{
			$("#emailTF").text("No password entered");
		}
		else if(data == "ILI")
		{
			$("#emailTF").text("Wrong Email or Password");
		}
		else if(data == "LI")
		{
			$("#emailTF").css("color","#29ae00");
			$("#emailTF").text("Logging In");
		}
	});
	
}




function createAccount()
{
	$.get("/data/createAccount", {email: $("#email").val(), password: $("#password").val()},function (data)
	{
		$("#emailTF").text("");

		$("#emailTF").css("color","#ff0000");
		if(data == "IEE")
		{
			$("#emailTF").text("Invalid Email Entered");
		}
		else if(data == "IPE")
		{
			$("#emailTF").text("Invalid Password Entered");
		}
		else if(data == "EIU")
		{
			$("#emailTF").text("Email In Use");
		}
		else if(data == "AC")
		{
			$("#emailTF").css("color","#29ae00");
			$("#emailTF").text("Account Created");
		}
	});
	
}

