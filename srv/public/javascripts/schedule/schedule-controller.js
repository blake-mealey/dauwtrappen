$(document).ready(function () {
	setupSidebar(true, SelectCourse);

	$("#save-btn").click(function() {
		//Implement some sort of save feature
		var $overlay = $("<div>", {
			id: "dark-overlay",
			style: "width: 100%; height: 100%; background-color: #000000; opacity: 0.5;"
		});
		

		// Hack to get rid of panel resizers
    	$(".ui-layout-resizer").hide();

		$(":root").append($overlay);
		$("#popup-style").removeClass("hidden");

		var temp = $("#popup-style").width();
		var temp2 = $("#popup-style").height();

		$("#popup-style").css({
			left: "calc(50% - " + temp/2 + "px)",
			top: "calc(50% - " + temp2/2 + "px)"
		});
	});

	$("#cancel-btn").click(function() {
		$("#name-input").val("");
		$("#name-input-cont").removeClass("is-dirty");
		$("#name-input-cont").removeClass("is-focused");
		//Show everthing like normal
		$(".ui-layout-resizer").show();
		$("#dark-overlay").remove();
		$("#popup-style").addClass("hidden");
	});

	$("#final-save-btn").click(function() {
		//Firstly we need to save everything
		var req = {
			scheduleName: $("#name-input").val(),
			sections: selectedSections
		}
		console.log(req);
		$.post("/data/saveSchedule", req, function(res) {
			console.log(res);
			//Then we need to reset everything
			$("#name-input").val("");
			$("#name-input-cont").removeClass("is-dirty");
			$("#name-input-cont").removeClass("is-focused");
			//Show everything as normal
			$(".ui-layout-resizer").show();
			$("#dark-overlay").remove();
			$("#popup-style").addClass("hidden");
		});
	});

	$("#load-btn").click(function() {
		console.log("Clicked load");
		//Implement some sort of load feature
		//Should popup a windows with a list of schedules that the user can select from
	});
});

var selected = {};
var selectedSections = [];
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

		for (var overlay in selected[id].overlays) {
			if (!selected[id].overlays.hasOwnProperty(overlay)) continue;
			selected[id].overlays[overlay].remove();
		}

		selected[id] = undefined;
		if(--selectedCount == 0) {
			$("#get-started").removeClass("hidden");
		}
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
		console.log(data.sections[i]);
		var section = data.sections[i];
		var $p = $("<p>");
		var $a = $("<a>", {
			text: section.type + ": " + section.time,
			href: "",
			"data-index": i
		});

		$a.click(function(e) {
			e.preventDefault();

			var index = $(this).attr("data-index");

			if (selected[id].overlays[index]) return;

			var $classOverlay = $("<div>", {
				class: "class-overlay",
				text: data.sections[index].time,
			});
			selectedSections.push(data.sections[index].section_id);

			var time = data.sections[index].time;
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

			selected[id].overlays[index] = $classOverlay; 
		});

		$p.append($a);
		$card.append($p);
	}

	$("#selected-courses").append($card);
	selected[id] = {
		card: $card,
		overlays: {}
	};
}
