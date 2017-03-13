$(document).ready(function () {
	$('body').layout({
		applyDefaultStyles: true,
		north: {
			resizable: false,
			closable: false
		},
		west: {
			closable: false,
			size: 400
		}
	});

	$.get("/data/courses", function(data) {
		if(!data) return;
		courseData = data;

		reloadContent();		// TODO: Which of these should go first? Can we do them at the same time?
		loadTree();
	});
});

var courseData;
var tree;
function loadTree() {
	tree = new InspireTree({
		target: '#courses-list',
		data: []
	});

	for(var facultyName in courseData) {
		if(!courseData.hasOwnProperty(facultyName)) continue;
		var faculty = courseData[facultyName];

		var facultyNode = tree.addNode({
			text: facultyName,
			link: facultyName + "/"
		});

		for(var deptName in faculty) {
			if(!faculty.hasOwnProperty(deptName)) continue;
			var deptartment = faculty[deptName];

			var deptNode = facultyNode.addChild({
				text: deptName,
				link: facultyNode.link + deptName + "/"
			});

			for(var levelNum in deptartment) {
				if(!deptartment.hasOwnProperty(levelNum)) continue;
				var level = deptartment[levelNum];

				var levelNode = deptNode.addChild({
					text: levelNum,
					link: deptNode.link + levelNum + "/"
				});

				for (var i = 0; i < level.length; i++) {
					var course = level[i];

					levelNode.addChild({
						text: course.number + ": " + course.name,
						link: levelNode.link.substr(0, levelNode.link.lastIndexOf("/", levelNode.link.length - 2) + 1)
						+ course.number + "/"
					});
				}
			}
		}
	}

	tree.expandDeep();

	tree.on("node.selected", function(node) {
		history.pushState(null, null, "/courses/" + node.link);
		reloadContent();
	});

	window.onpopstate = history.onpushstate = reloadContent;
}

var lastUrl;
var $content;
function reloadContent() {
	var url = window.location.href;
	if (lastUrl && url != lastUrl) return;
	var parts = url.split("/");

	$content = $(".ui-layout-center");
	$content.empty();

	var faculty = parts[4];

	if(faculty && faculty.trim() != '') {
		var dept = parts[5];

		if(dept && dept.trim() != '') {
			var level = parts[6];

			if(level && level.trim() != '') {
				if(level % 100 != 0) {
					displayCourse(getCourse(faculty, dept, level));
				} else {
					try { displayLevel(level, courseData[faculty][dept][level]);
					} catch (e) { displayError("level"); }
				}
			} else {
				try {
					displayDepartment(dept, courseData[faculty][dept]);
				} catch (e) { displayError("department") }
			}
		} else {
			try {
				displayFaculty(faculty, courseData[faculty]);
			} catch (e) { displayError("faculty") }
		}
	} else {
		displayAll();
	}
}

function displayAll() {
	for(var facultyName in courseData) {
		if (!courseData.hasOwnProperty(facultyName)) continue;
		var faculty = courseData[facultyName];
		displayFaculty(facultyName, faculty);
	}
}

function displayFaculty(name, faculty) {
	if(!faculty) return displayError("faculty");
	var $faculty = $("<div>", { class: "nested" });
	$faculty.append($("<h1>", { text: name }));
	for(var deptName in faculty) {
		if (!faculty.hasOwnProperty(deptName)) continue;
		var dept = faculty[deptName];
		displayDepartment(deptName, dept, $faculty);
	}
	$content.append($faculty);
}

function displayDepartment(name, department, $parent) {
	if(!department) return displayError("department");
	$parent = $parent ? $parent : $content;

	var $dept = $("<div>", { class: "nested" });
	$dept.append($("<h2>", { text: name }));

	for(var levelNum in department) {
		if (!department.hasOwnProperty(levelNum)) continue;
		var level = department[levelNum];
		displayLevel(levelNum, level, $dept);
	}
	$parent.append($dept);
}

function displayLevel(num, level, $parent) {
	if(!level) return displayError("level");
	$parent = $parent ? $parent : $content;

	var $level = $("<div>", { class: "nested" });
	$level.append($("<h3>", { text: num + " Level Courses" }));

	for (var i = 0; i < level.length; i++) {
		var course = level[i];
		displayCourse(course, $level);
	}
	$parent.append($level);
}

function getCourse(facultyName, deptName, number) {
	var dept = courseData[facultyName][deptName][Math.floor(number/100)*100];
	console.log(number);
	for (var i = 0; i < dept.length; i++) {
		var course = dept[i];
		console.log(course);
		if(course.number == number) {
			return course;
		}
	}
}

function displayCourse(course, $parent) {
	if(!course) return displayError("course");
	$parent = $parent ? $parent : $content;

	$course = $("<div>", {
		class: "course"
	});

	$course.append($("<h4>", { text: course.number + ": " + course.name }));
	$course.append($("<p>", { text: course.description }));
	$parent.append($course);
}

function displayError(type) {
	console.log(type);
	$content.append($("<h4>", { text: "No such " + type + " exists. Make sure your URL is correct" }));
	return false;
}