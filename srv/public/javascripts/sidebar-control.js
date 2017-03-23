var courseData;
var tree;

function setupSidebar(nodeSelectedCb, stepCb, finishedCb) {
	courseData = {};

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

	$.get("/data/semesters", function(semesters) {
		if(!semesters) return;
		var semester = semesters["2181"];

		for (var i = 0; i < semester.faculties.length; i++) {
			var faculty = semester.faculties[i];
			courseData[faculty] = {};
		}
		loadFacultiesInTree();

		var index = 0;
		function nextFac() {
			var fac = semester.faculties[index++];
			if(!fac) {
				if(finishedCb) finishedCb();
				return;
			}
			$.get("/data/courses", { semesterId: semester.id, facultyName: fac }, function(data) {
				if(!data) return;
				console.log(data);
				courseData[fac] = data;
				loadFacultyData(fac);
				tree.expand();
				if(stepCb) stepCb(fac);
				nextFac();
			});
		}
		nextFac();
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
		var deptartment = faculty[deptName];

		var deptNode = {
			text: getDepartmentFullName(deptName),
			link: facultyNode.link + deptName + "/",
			type: "deptartment",
			children: []
		};

		for(var levelNum in deptartment) {
			if(!deptartment.hasOwnProperty(levelNum)) continue;
			var level = deptartment[levelNum];
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
