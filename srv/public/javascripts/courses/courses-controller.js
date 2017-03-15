$(document).ready(function () {
	$.get("/data/courses", function(data) {
		if(!data) return;
		courseData = data;

		reloadContent();		// TODO: Which of these should go first? Can we do them at the same time?
		loadTree();
		setupSearch();
	});
});

function allNodesToList(list, parent) {
	parent.each(function(node) {
		list.push(node);
		allNodesToList(list, node.getChildren());
	});
}

function setupSearch() {
	$("#search-box-input").on("input", function() {
		var filter = $(this).val();
		// Puts a space between a letter followed by a number so 'cpsc101' goes to 'cpsc 101' which is
		// correctly matched by our search
		filter = filter.replace(/([^0-9])([0-9])/g, '$1 $2');
		console.log(filter);



		if(filter == "") {
			tree.clearSearch();
			tree.expandDeep();
		} else {
			tree.search(function(node) {
				var result = fuzzy_match(node.text, filter);
				var result2 = fuzzy_match(node.getTextualHierarchy().join(" "), filter);
				var resultVal = Math.max(result[1], result2[1]);
				if(resultVal > 0) {
					console.log(node.getTextualHierarchy().join(" ") + ": " + resultVal);
					// node.expandParents();
					// node.expand();
				}
				return resultVal > 0;
			});
			// tree.collapseDeep();
			// var nodes = [];
			// allNodesToList(nodes, tree);
			// for (var i = 0; i < nodes.length; i++) {
			// 	var node = nodes[i];
			// }
		}
	});
}

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
				text: getDepartmentFullName(deptName),
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

	tree.on("model.loaded", function() {
		tree.expandDeep();
	});

	tree.on("node.selected", function(node) {
		history.pushState(null, null, "/courses/" + node.link);
		reloadContent();
	});

	window.onpopstate = history.onpushstate = reloadContent;
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

	// TODO: replace link click with history.pushState
	var link = "/courses";
	crumb($crumbs, "Home", link, !faculty);
	if (faculty) {
		link += "/" + faculty;
		crumb($crumbs, faculty, link, !dept);
		if (dept) {
			link += "/" + dept;
			crumb($crumbs, getDepartmentFullName(dept), link, !level);
			if (level) {
				if (level % 100 == 0) {
					link += "/" + level;
					crumb($crumbs, level, link, true);
				} else {
					var levelGroup = Math.floor(level/100)*100;
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

function appendLink($obj, url) {
	var $a = $("<a class='material-icons header-link' href=''>link</a>");
	$a.click(function(e) {
		e.preventDefault();
		history.pushState(null, null, url);
		reloadContent();
	});
	$obj.append($a);
}

function displayFaculty(name, faculty) {
	if(!faculty) return displayError("faculty");
	var $faculty = $("<div>", { class: "nested" });
	var $h = $("<h1>", { text: name });
	appendLink($h, "/courses/" + name);
	$faculty.append($h);
	for(var deptName in faculty) {
		if (!faculty.hasOwnProperty(deptName)) continue;
		var dept = faculty[deptName];
		displayDepartment(deptName, dept, $faculty, name);
	}
	$content.append($faculty);
}

function getDepartmentFullName(name) {
	for(var facultyName in courseData) {
		if(!courseData.hasOwnProperty(facultyName)) continue;

		var faculty = courseData[facultyName];
		if(faculty[name]) {
			var dept = faculty[name];
			for(var levelNum in dept) {
				if(!dept.hasOwnProperty(levelNum)) continue;

				var level = dept[levelNum];
				return level[0].dept_full_name;
			}
		}
	}
}

function displayDepartment(name, department, $parent, facultyName) {
	if(!department) return displayError("department");
	$parent = $parent ? $parent : $content;

	var $dept = $("<div>", { class: "nested" });
	var $h = $("<h2>", { text: getDepartmentFullName(name) });
	appendLink($h, "/courses/" + facultyName + "/" + name);
	$dept.append($h);

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
	var $h = $("<h3>", { text: num + " Level Courses" });
	appendLink($h, "/courses/" + facultyName + "/" + deptName + "/" + num);
	$level.append($h);

	var $courses = $("<div>", { class: "nested" });
	for (var i = 0; i < level.length; i++) {
		var course = level[i];
		displayCourse(course, $courses);
	}
	$level.append($courses);
	$parent.append($level);
}

function getCourse(facultyName, deptName, number) {
	var dept = courseData[facultyName][deptName][Math.floor(number/100)*100];
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

	var $h = $("<h4>", {text: course.number + ": " + course.name});
	appendLink($h, "/courses/" + course.fac_name + "/" + course.dept_name + "/" + course.number);

	$course.append($h);
	$course.append($("<p>", {text: course.description}));
	$parent.append($course);
}

function displayError(type, e) {
	if(e) console.log(e);
	$content.append($("<h4>", { text: "No such " + type + " exists 😞. Make sure your URL is correct." }));
	return false;
}