var semesterData;
var currentSemester;
var courseData;
var tree;

function setupSidebar(nodeSelectedCb, stepCb, finishedCb) {
	semesterData = {};

	tree = new InspireTree({
		target: '#courses-list',
		data: function(node) {
			if(node) {
				return new Promise(function (resolve) {
					if(node.loadedData) {
						resolve(node.loadedData);
						node.loadedData = undefined;
					} else {
						node.finished = function () {
							resolve(node.loadedData);
							node.loadedData = undefined;
						}
					}
				});
			}
		}
	});
	if(nodeSelectedCb) tree.on("node.selected", nodeSelectedCb);

	setupSearch();
	setupSemesterSelector();

	// TODO: Read the semester query from the URL

	$.get("/data/semesters", function(semesters) {
		if(!semesters) return;

		var $selector = $("#semester_selector");

		for(var i = 0; i < semesters.length; i++) {
			var semester = semesters[i];
			$selector.append($("<option>", {value: semester.id, text: semester.name}));
		}

		var index = 0;
		function nextSemester() {
			var semester = semesters[index++];
			if(!semester) {
				if (finishedCb) finishedCb();
				return;
			}

			// TODO: Load the current semester first.

			semesterData[semester.id] = {
				data: {},
				loaded: false,
				lastFaculty: undefined
			};

			for (var i = 0; i < semester.faculties.length; i++) {
				var faculty = semester.faculties[i];
				semesterData[semester.id].data[faculty] = {};
			}

			if(!currentSemester || semester.id == currentSemester) {
				currentSemester = semester.id;
				courseData = semesterData[currentSemester].data;
				loadFacultiesInTree();
			}

			var facIndex = 0;
			function nextFaculty() {
				var fac = semester.faculties[facIndex++];
				semesterData[semester.id].lastFaculty = fac;
				if (!fac) {
					semesterData[semester.id].loaded = true;
					nextSemester();
					return;
				}
				$.get("/data/courses", {semesterId: semester.id, facultyName: fac}, function (data) {
					if (!data) return;
					semesterData[semester.id].data[fac] = data;
					console.log(semester.id);
					if(semester.id == currentSemester) {
						loadFacultyData(fac);
						tree.expand();
					}
					if (stepCb) stepCb(fac);
					nextFaculty();
				});
			}
			nextFaculty();
		}
		nextSemester();
	});
}

function setupSemesterSelector() {
	// TODO: Cancel current loading semester to load this semester
	// TODO: Add query to URL
	$("#semester_selector").change(function() {
		currentSemester = $(this).val();
		console.log(currentSemester);
		if(!semesterData[currentSemester]) {
			semesterData[currentSemester] = {
				data: {},
				loaded: false,
				lastFaculty: undefined
			}
		}
		courseData = semesterData[currentSemester].data;

		loadFacultiesInTree();

		var last = semesterData[currentSemester].lastFaculty;
		if(!semesterData[currentSemester].loaded && last) {
			for (var facName in courseData) {
				if(!courseData.hasOwnProperty(facName)) continue;
				if(facName == last) break;

				loadFacultyData(facName);
			}
		}
	});
}

function setupSearch() {
	$("#search-box-input").on("input", function() {
		var filter = $(this).val().toLowerCase();
		// Puts a space between a letter followed by a number so 'cpsc101' goes to 'cpsc 101' which is
		// correctly matched by our search
		filter = filter.replace(/([^0-9])([0-9])/g, '$1 $2');
		var parts = filter.split(" ");
		console.log(filter);

		if(filter == "") {
			tree.clearSearch();
			tree.expand();
		} else {
			tree.search(function(node) {
				var text = node.text.toLowerCase();
				if(text.includes(filter)) return true;
				for (var i = parts.length - 1; i >= 0; i--) {
					if(text.includes(parts[i])) return true;
				}
			});
		}
	});
}

function loadFacultiesInTree() {
	tree.removeAll();
	for(var facultyName in courseData) {
		if (!courseData.hasOwnProperty(facultyName)) continue;
		var facultyNode = tree.addNode({
			text: facultyName,
			link: facultyName + "/",
			type: "faculty",
			children: true
		});
		tree.addNode(facultyNode);
	}
}

function getRootNodeWithText(text) {
	var nodes = tree.nodes();
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		if(node.text == text) return node;
	}
}

function loadFacultyData(facultyName) {
	var faculty = courseData[facultyName];
	var facultyNode = getRootNodeWithText(facultyName);

	var data = [];

	for(var deptName in faculty) {
		if(!faculty.hasOwnProperty(deptName)) continue;
		var department = faculty[deptName];

		var deptNode = {
			text: getDepartmentFullName(deptName),
			link: facultyNode.link + deptName + "/",
			type: "department",
			children: []
		};

		for(var levelNum in department) {
			if(!department.hasOwnProperty(levelNum)) continue;
			var level = department[levelNum];

			var levelNode = {
				text: levelNum,
				link: deptNode.link + levelNum + "/",
				type: "level",
				children: []
			};

			for(var courseNum in level) {
				if(!level.hasOwnProperty(courseNum)) continue;
				var course = level[courseNum];

				levelNode.children.push({
					text: course.number + ": " + course.name,
					link: levelNode.link.substr(0, levelNode.link.lastIndexOf("/", levelNode.link.length - 2) + 1)
					+ course.number + "/",
					type: "course",
					data: course
				});
			}
			deptNode.children.push(levelNode)
		}
		data.push(deptNode);
	}

	facultyNode.loadedData = data;
	if(facultyNode.finished) facultyNode.finished();
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

				for(var courseNum in level) {
					if (!level.hasOwnProperty(courseNum)) continue;

					return level[courseNum].dept_full_name;
				}
			}
		}
	}
}
