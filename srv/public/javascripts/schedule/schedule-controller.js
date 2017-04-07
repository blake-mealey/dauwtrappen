$(document).ready(function () {
	setupSidebar(true, SelectCourse);
});

var selected = {};
var selectedCount = 0;

var daysToNum = {"Mon": 1, "Tue": 2, "Wed": 3,"Thu": 4,"Fri": 5,"Sat": 6,"Sun": 7};

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

			//Remove the day from the time
			time = time.substring(3);
			var timeArr = time.split("-");
			var timeL = timeArr[0];
			var timeR = timeArr[1];

			var startHour = Number(timeL.split(":")[0].trim());
			var startMinute = Number(timeL.split(":")[1].trim());
			timeL = startHour*60 + startMinute;
			timeR = Number(timeR.split(":")[0].trim())*60 + Number(timeR.split(":")[1].trim());

			//Calculate the difference in the courses start time vs end time to calculate the height and top values of this class
			var scale = (timeR - timeL) / 60;
			var top = ((startHour - 6) * 6.666) + (6.666 * startMinute/60) * 100;


			$classOverlay.css({
				top: top + "%", 
				left: (daysToNum[day])/8 * 100 + 0.25 + "%",
				height: 6.66*scale + "%",
				width: "12%"
			});

			$("table").append($classOverlay);
		});

		$p.append($a);
		$card.append($p);
	}

	$("#selected-courses").append($card);
	selected[id] = $card;
}
