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

	$.get("search/coursedata", function(data, status) {
		if(data) {
			for (var i = 0; i < data.length; i++) {
				var course = data[i];
				console.log(course);

				$li = $("<li>", {
					text: course.name
				});

				$("#courses-list").append($li);
			}
		}
	});
});