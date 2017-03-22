$(document).ready(function () {
	setupSidebar(nodeSelected, function() {
		reloadContent();
	});

	window.onpopstate = history.onpushstate = reloadContent;
});

function nodeSelected(node) {
	history.pushState(null, null, "/courses/" + node.link);
	reloadContent();
}

function crumb($crumbs, text, link, last) {
	$crumb = $("<div>", {
		class: "bread-crumb bread-crumb-tag " + (last ? "current-crumb" : "")
	});
	$a = $("<a href=''>");
	$a.text(text);
	$a.click(function(e) {
		e.preventDefault();
		history.pushState(null, null, link);
		reloadContent();
	});
	$crumb.append($a);
	$crumbs.append($crumb);

	if(!last) {
		var $next = $("<div>", {
			class: "bread-crumb material-icons",
			text: "navigate_next"
		});
		$crumbs.append($next);
	}
}

function resetBreadcrumbs(faculty, dept, level) {
	var $crumbs = $("#bread-crumbs");
	$crumbs.empty();

	var link = "/courses";
	crumb($crumbs, "Home", link, !faculty);
	if (faculty) {
		link += "/" + faculty;
		crumb($crumbs, faculty, link, !dept);
		if (dept) {
			link += "/" + dept;
			crumb($crumbs, dept, link, !level);
			if (level) {
				if (level % 100 == 0) {
					link += "/" + level;
					crumb($crumbs, level, link, true);
				} else {
					var levelGroup = getLevelNum(level);
					var link2 = link + "/" + levelGroup;
					crumb($crumbs, levelGroup, link2, false);

					link += "/" + level;
					crumb($crumbs, level, link, true);
				}
			}
		}
	}
}

var lastUrl;
var $content;
function reloadContent() {
	var url = window.location.href;
	if (lastUrl && url != lastUrl) return;
	if(url.indexOf("#") > -1)
		url = url.substr(0, url.indexOf("#"));
	if(url.indexOf("?") > -1)
		url = url.substr(0, url.indexOf("?"));
	var parts = url.split("/");

	$content = $("#content");
	$content.empty();

	resetBreadcrumbs(parts[4], parts[5], parts[6]);
	var faculty = parts[4];

	if(faculty && faculty.trim() != '') {
		var dept = parts[5];

		if(dept && dept.trim() != '') {
			var level = parts[6];

			if(level && level.trim() != '') {
				if(level % 100 != 0) {
					displayCourse(getCourse(faculty, dept, level));
				} else {
					try { displayLevel(level, courseData[faculty][dept][level], null, faculty, dept);
					} catch (e) { displayError("level", e); }
				}
			} else {
				try {
					displayDepartment(dept, courseData[faculty][dept], null, faculty);
				} catch (e) { displayError("department", e); }
			}
		} else {
			try {
				displayFaculty(faculty, courseData[faculty]);
			} catch (e) { displayError("faculty", e); }
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

function createLinkHeader($parent, tag, text, url) {
	var $a = $("<a class='header-link' href=''>");
	$a.click(function(e) {
		e.preventDefault();
		history.pushState(null, null, url);
		reloadContent();
	});
	var $h = $(tag, { text: text });
	$a.append($h);
	$parent.append($a);
}

function displayFaculty(name, faculty) {
	if(!faculty) return displayError("faculty");
	var $faculty = $("<div>", { class: "nested" });
	createLinkHeader($faculty, "<h1>", name, "/courses/" + name);
	for(var deptName in faculty) {
		if (!faculty.hasOwnProperty(deptName)) continue;
		var dept = faculty[deptName];
		displayDepartment(deptName, dept, $faculty, name);
	}
	$content.append($faculty);
}

function displayDepartment(name, department, $parent, facultyName) {
	if(!department) return displayError("department");
	$parent = $parent ? $parent : $content;

	var $dept = $("<div>", { class: "nested" });
	createLinkHeader($dept, "<h2>", getDepartmentFullName(name), "/courses/" + facultyName + "/" + name);

	for(var levelNum in department) {
		if (!department.hasOwnProperty(levelNum)) continue;
		var level = department[levelNum];
		displayLevel(levelNum, level, $dept, facultyName, name);
	}
	$parent.append($dept);
}

function displayLevel(num, level, $parent, facultyName, deptName) {
	if(!level) return displayError("level");
	$parent = $parent ? $parent : $content;

	var $level = $("<div>", { class: "nested" });
	createLinkHeader($level, "<h3>", num + " Level Courses", "/courses/" + facultyName + "/" + deptName + "/" + num);

	var $courses = $("<div>", { class: "nested" });
	for(var courseNum in level) {
		if(!level.hasOwnProperty(courseNum)) continue;
		var course = level[courseNum];
		displayCourse(course, $courses);
	}
	$level.append($courses);
	$parent.append($level);
}

function getCourse(facultyName, deptName, number) {
	var dept = courseData[facultyName][deptName][getLevelNum(number)];
	for (var i = 0; i < dept.length; i++) {
		var course = dept[i];
		if(course.number == number) {
			return course;
		}
	}
}

function displayCourse(course, $parent) {
	if(!course) return displayError("course");
	$parent = $parent ? $parent : $content;

	var $course = $("<div>", {
		class: "course"
	});

	createLinkHeader($course, "<h4>", course.number + ": " + course.name, "/courses/" + course.fac_name + "/" + course.dept_name + "/" + course.number);

	$course.append($("<p>", {text: course.description}));
	$parent.append($course);
}

function displayError(type, e) {
	if(e) console.log(e);
	$content.append($("<h4>", { text: "No such " + type + " exists 😞. Make sure your URL is correct." }));
	return false;
}

function getLevelNum(courseNum) {
	return Math.floor(courseNum.substr(0, 3)/100)*100
}