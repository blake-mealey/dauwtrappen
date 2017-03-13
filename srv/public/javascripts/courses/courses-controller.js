$(document).ready(function () {
	$('body').layout({
		applyDefaultStyles: true,
		north: {
			resizable: false,
			closable: false
		},
		west: {
			closable: false
		}
	});

	$.get("data", function(data) {
		if(data) {
			for (var i = 0; i < data.length; i++) {
				var course = data[i];
				console.log(course);

				$a = $("<a href='#'>");
				$li = $("<li>", {
					text: course.name
				});

				$a.append($li);
				$("#courses-list").append($a);
			}
		}
	});
});