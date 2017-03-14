$(document).ready(function () {
	$("#primary-nav > button").click(function() {
		window.location = window.location.origin + $(this).attr("data-nav");
	});
});