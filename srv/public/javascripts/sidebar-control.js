var courseData;
var tree;

function setupSidebar(nodeSelectedCb, cb) {
	courseData = {};

	tree = new InspireTree({
		target: '#courses-list',
		data: function(node, resolve, reject) {
			if(node) {
				return new Promise(function (resolve, reject) {
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
	/*tree.on("model.loaded", function() {
		tree.expand();
	});*/
	tree.on("node.selected", nodeSelectedCb);

	setupSearch();

	$.get("/data/semesters", function(semesters) {
		if(!semesters) return;
		var semester = semesters["2181"];

		for (var i = 0; i < semester.faculties.length; i++) {
			var faculty = semester.faculties[i];
			courseData[faculty] = {};
		}
		loadFacultiesInTree();
		cb();

		var index = 0;
		function nextFac() {
			var fac = semester.faculties[index++];
			if(!fac) {
				if(cb) cb();
				return;
			}
			$.get("/data/courses", { semesterId: semester.id, facultyName: fac }, function(data) {
				if(!data) return;
				courseData[fac] = data;
				loadFacultyData(fac);
				cb();
				nextFac();
			});
		}
		nextFac();
	});
}

function setupSearch() {	// TODO: Remove fuzzy match
	$("#search-box-input").on("input", function() {
		var filter = $(this).val();
		// Puts a space between a letter followed by a number so 'cpsc101' goes to 'cpsc 101' which is
		// correctly matched by our search
		filter = filter.replace(/([^0-9])([0-9])/g, '$1 $2');
		console.log(filter);

		if(filter == "") {
			tree.clearSearch();
			tree.expand();
		} else {
			tree.search(function(node) {
				var result = fuzzy_match(node.text, filter);
				var result2 = fuzzy_match(node.getTextualHierarchy().join(" "), filter);
				var resultVal = Math.max(result[1], result2[1]);
				if(resultVal > 0) {
					console.log(node.getTextualHierarchy().join(" ") + ": " + resultVal);
				}
				return resultVal > 0;
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

			for (var i = 0; i < level.length; i++) {
				var course = level[i];

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

function loadTree() {
	for(var facultyName in courseData) {
		if(!courseData.hasOwnProperty(facultyName)) continue;
		var faculty = courseData[facultyName];

		var facultyNode = tree.addNode({
			text: facultyName,
			link: facultyName + "/",
			type: "faculty"
		});

		for(var deptName in faculty) {
			if(!faculty.hasOwnProperty(deptName)) continue;
			var deptartment = faculty[deptName];

			var deptNode = facultyNode.addChild({
				text: getDepartmentFullName(deptName),
				link: facultyNode.link + deptName + "/",
				type: "deptartment"
			});

			for(var levelNum in deptartment) {
				if(!deptartment.hasOwnProperty(levelNum)) continue;
				var level = deptartment[levelNum];

				var levelNode = deptNode.addChild({
					text: levelNum,
					link: deptNode.link + levelNum + "/",
					type: "level"
				});

				for (var i = 0; i < level.length; i++) {
					var course = level[i];

					levelNode.addChild({
						text: course.number + ": " + course.name,
						link: levelNode.link.substr(0, levelNode.link.lastIndexOf("/", levelNode.link.length - 2) + 1)
						+ course.number + "/",
						type: "course",
						data: course
					});
				}
			}
		}
	}
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
