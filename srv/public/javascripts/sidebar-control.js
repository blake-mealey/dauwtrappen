function setupSidebar(nodeSelectedCb, setupCb) {
	$.get("/data/courses", function(data) {
		if(!data) return;
		courseData = data;

		loadTree(nodeSelectedCb);
		setupSearch();
		if(setupCb) setupCb();
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

var courseData;
var tree;
function loadTree(nodeSelected) {
	tree = new InspireTree({
		target: '#courses-list',
		data: []
	});

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

	tree.on("model.loaded", function() {
		tree.expand();
	});

	tree.on("node.selected", nodeSelected);
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

function getCourse(facultyName, deptName, number) {
	var dept = courseData[facultyName][deptName][Math.floor(number/100)*100];
	for (var i = 0; i < dept.length; i++) {
		var course = dept[i];
		if(course.number == number) {
			return course;
		}
	}
}
