$(document).ready(function () {
	setupSidebar(true, SelectCourse);
});

var selected = {};
var selectedCount = 0;

function SelectCourse(node) {

	// Node contains all of the information pertaining to the courses secions
	// Need to have some sort of popup to display all of the sections.
	// Display by Lec first, lab second, tut last

	if(node.type != "course") return;
	var data = node.data;
	var id = data.dept_name + " " + data.number;
	if(selected[id]) return;

	if(selectedCount++ == 0) {
		$("#get-started").addClass("hidden");
	}

	var $card = $("<div>", {
		class: "card"
	});

	var $title = $("<h5>", {
		text: id
	});
	$card.append($title);

	var $close = $("<button>", {
		class: "mdl-button mdl-js-button mdl-button--icon close-button"
	});
	$close.click(function() {
		$card.remove();
		selected[id] = undefined;
		if(--selectedCount == 0) {
			$("#get-started").removeClass("hidden");
		}
		//TODO: remove from table
	});
	var $i = $("<i>", {
		class: "material-icons",
		text: "close"
	});
	$close.append($i);
	$card.append($close);

	data.sections.sort(
		function(x, y) {
			if(x.type == y.type) {
				return 0;
			} else if (x.type == "LEC") {
				return -1;
			} else if (x.type == "LAB" && y.type == "LEC"){
				return 1;
			} else {
				return 1;
			}
		}
	);

	for(var i = 0; i < data.sections.length; i++) {
		var section = data.sections[i];
		var $p = $("<p>");
		var $a = $("<a>", {
			text: section.type + ": " + section.time,
			href: "",
			"data-index": i
		});

		$a.click(function(e) {
			e.preventDefault();
			//TODO: Add course to schedule
			var $classOverlay = $("<div>", {
				class: "class-overlay",
				text: data.sections[$(this).attr("data-index")].time
			});
			console.log(data.sections[$(this).attr("data-index")].time);

			var time = data.sections[$(this).attr("data-index")].time;
			var day = time.substring(0, 3);
			time = time.substring(3);
			time = time.split(":")[0];

			var temp = $("#"+day).position();
			var temp2 = $("#"+time).position();

			var height = $("#"+day).parent().height();
			var width = $("#"+day).width();

			var twidth = $("#"+day).parent().parent().width();
			var theight = $("#"+day).parent().parent().height();

			console.log(height);

			$classOverlay.css({
				top: temp2.top/theight*100 - 6.4 + "%", 
				left: temp.left/twidth*100 + 0.25 + "%",
				height: "6.4%",
				width: "12.25%"
			});

			$("table").append($classOverlay);
		});

		$p.append($a);
		$card.append($p);
	}

	$("#selected-courses").append($card);
	selected[id] = $card;
}
