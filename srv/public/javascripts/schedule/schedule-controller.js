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
			"sections[]": selectedSections
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
		console.log("Loading");
		$.get("/data/loadSchedule", {}, function(res) {
			clearSelected();
			console.log(res);
			loadSchedule(res);
		});

		//Implement some sort of load feature
		//Should popup a windows with a list of schedules that the user can select from
	});
});

function loadSchedule(scheduleInfo) {

	//scheduleInfo contains 2 bits of information: course 
	for (var i in scheduleInfo.schedule) {
		var temp = scheduleInfo.schedule[i];
		var data = courseData[temp.dept_name[0]][temp.dept_name][temp.course_num[0]+"00"][temp.course_num];

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

		SelectCourse({
			data: data,
			type: "course"
		});

		for(var j = 0; j < data.sections.length; j++) {
			if (data.sections[j].section_id == temp.id) {
				addSectionOverlay(j, temp.dept_name + " " + temp.course_num, data);
				break;
			}
		}
	}
}

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

		for (var overlayArray in selected[id].overlays) {
			if (!selected[id].overlays.hasOwnProperty(overlayArray)) continue;
			for (var overlay in selected[id].overlays[overlayArray]) {
				if (!selected[id].overlays[overlayArray].hasOwnProperty(overlay)) continue;
				var section_id = Number(selected[id].overlays[overlayArray][overlay].attr("data-index"));
				var index = selectedSections.indexOf(section_id);
				if (index > -1) selectedSections.splice(index, 1);

				selected[id].overlays[overlayArray][overlay].remove();
			}
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
		var section = data.sections[i];
		var $p = $("<p>");
		var formattedTime = formatTime(section.time);
		var $a = $("<a>", {
			text: section.type + " " + section.section_number + ": " + formattedTime,
			href: "",
			"data-index": i,
			"id-index": id
		});

		$a.click(function(e) {
			e.preventDefault();

			var index = $(this).attr("data-index");
			var name = $(this).attr("id-index");
			addSectionOverlay(index, name, data);
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

function addSectionOverlay(index, name, data) {

	if (selected[name].overlays[index] || data.sections[index].time == "") return;

	var totalTime = data.sections[index].time.split(".");
	if (totalTime.length > 0) totalTime.splice(totalTime.length-1, 1);


	//Push the section id
	selectedSections.push(data.sections[index].section_id);

	// for each class time t in time
	for (var t in totalTime) {

		var split = totalTime[t].split(",");
		var day = split[0];
		var t1 = split[1];
		var t2 = split[2];

		var $classOverlay = $("<div>", {
			class: "class-overlay",
			text: name + " " + data.sections[index].type + data.sections[index].section_number,
			"data-index": data.sections[index].section_id
		});

		$classOverlay.append("<br>");
		$classOverlay.append(split[1]+"-"+split[2]);

		//Find the time difference in minutes
		var diff = getTimeDifference(t1, t2);
		var start = parseTime(t1);

		//Calculate the difference in the courses start time vs end time to calculate the height and top values of this class
		var scale = diff / 60;
		var top = ((start.hour - 6) * 6.666) + (6.666 * start.minute/60);

		$classOverlay.css({
			top: top + "%", 
			left: (daysToNum[day])/8 * 100 + 0.25 + "%",
			height: 6.66*scale + "%",
			width: "12%"
		});

		$("table").append($classOverlay);

		if (selected[name].overlays[index]) selected[name].overlays[index].push($classOverlay);
		else { 
			selected[name].overlays[index] = [];
			selected[name].overlays[index].push($classOverlay);
		};	
	} 
}

//Removes all of the current selected courses and schedules
function clearSelected() {

	for (var id in selected) {
		if (!selected[id]) continue;
		selected[id].card.remove();
		for (var overlayArray in selected[id].overlays) {
			if (!selected[id].overlays.hasOwnProperty(overlayArray)) continue;
			for (var overlay in selected[id].overlays[overlayArray]) {
				if (!selected[id].overlays[overlayArray].hasOwnProperty(overlay)) continue;
				var section_id = Number(selected[id].overlays[overlayArray][overlay].attr("data-index"));
				var index = selectedSections.indexOf(section_id);
				if (index > -1) selectedSections.splice(index, 1);

				selected[id].overlays[overlayArray][overlay].remove();
			}
		}

		if(--selectedCount == 0) {
			$("#get-started").removeClass("hidden");
		}
	}
	selected = {};
}

//Assume time1 and time2 follow this format: 9:00AM
function getTimeDifference(time1, time2) {

	var time1Parsed = parseTime(time1);
	var time2Parsed = parseTime(time2);

	var time1Final = (time1Parsed.hour * 60) + time1Parsed.minute;
	var time2Final = (time2Parsed.hour * 60) + time2Parsed.minute;

	return time2Final - time1Final;
}

//Returns the hour of the given time
function parseTime(time) {
	var split = time.split(":");

	var h = Number(split[0]);
	var m = Number(split[1].substring(0,2));
	var a = split[1].substring(2); 

	if (a == "PM") h += 12;

	return {hour: h, minute: m};
}

//formats the time string for displaying
function formatTime(time) {

	if (time == "") return "No Times";

	var formatted = "";

	var split = time.split(".");
	split.splice(split.length-1, 1);

	for (var i in split) {
		formatted += split[i].split(",")[0] + ",";
	}

	var temp = split[split.length-1].split(",");
	formatted += temp[1] + "-" + temp[2];

	return formatted;
}