var request = require('request');
var cheerio = require('cheerio');
var escape = require('pg-escape');

var Client = require("pg").Client;

var config = {
	user: "postgres", //env var: PGUSER
	database: "ddn_db",
	password: "carrots", //env var: PGPASSWORD
	host: "localhost", // Server hosting the postgres database
	port: 5432 //env var: PGPORT
};

var url = "https://www.ucalgary.ca/pubs/calendar/current/";

function query(url, cb) {
	request(url, function (error, response, body) {
		if(error) return console.log(error);
		cb(cheerio.load(body));
	});
}

function scrape(cb) {
	var courses = {};
	var courseIds = [];

	query(url + "course-desc-main.html", function ($) {
		var res = $(".contents-text");
		var count = res.toArray().length;
		res.each(function () {
			if ($(this).css("margin-left") == "0px") {
				if(--count == 0) cb(courses, courseIds);
				return;
			}

			var text = $(this).text().trim();
			var deptName = text.substring(text.length - 4).trim();
			var deptFullName = text.substring(0, text.length - 4).trim();

			// if(deptName != "ZOOL") {
			// 	if(--count == 0) cb(courses, courseIds);
			// 	return;
			// }

			var href = $(this).find("a").attr("href");

			query(url + href, function ($) {
				$(".item-container").each(function () {
					var desc = $(this).find(".course-desc").text().trim();
					if (desc == "") return;
					var id = $(this).find("> a").attr("name");

					var course = {
						deptName: deptName,
						deptFullName: deptFullName,
						description: desc
					};

					var courseCodeIndex = 0;
					$(this).find(".course-code").each(function () {
						if (courseCodeIndex == 0) {
							// course.deptName = $(this).text().trim();
						} else if (courseCodeIndex == 1) {
							course.number = $(this).text().trim();
						} else if (courseCodeIndex == 2) {
							course.name = $(this).text().trim();
						}
						courseCodeIndex++;
					});

					course.prerequisites = [];
					$(this).find(".course-prereq > a").each(function () {
						var text = $(this).attr("href");
						var index = text.indexOf("#");
						var href = text.substring(0, index);
						var pId = text.substring(index + 1);
						course.prerequisites.push(pId);		// TODO: do we need href too?
					});

					courses[id] = course;
					courseIds.push(id);
					console.log(course);
				});

				if(--count == 0) cb(courses, courseIds);
			});
		});
	});
}

function saveFaculty(client, faculty, cb) {
	var q = escape("INSERT INTO faculty VALUES(%L) ON CONFLICT DO NOTHING", faculty);
	// console.log(q);
	client.query(q, function(err) {
		if(err) return console.log(err);
		if(cb) cb();
	});
}

function saveDepartment(client, course, cb) {
	var faculty = course.deptName[0];
	saveFaculty(client, faculty, function() {
		var q = escape("INSERT INTO department VALUES(%L,%L) " +
			"ON CONFLICT (name) DO UPDATE SET full_name=%L",
			course.deptName, course.deptFullName, course.deptFullName);
		// console.log(q);
		client.query(q, function (err) {
			if(err) return console.log(err);
			q = escape("INSERT INTO faculty_contains VALUES(%L,%L) ON CONFLICT DO NOTHING", faculty, course.deptName);
			// console.log(q);
			client.query(q, function (err) {
				if(err) return console.log(err);
				savedDepts[course.deptName] = true;
				if(cb) cb();
			});
		});
	});
}

var savedDepts = {};
function saveCourse(client, course, cb) {
	function doIt() {
		var q = escape("INSERT INTO course VALUES(%L,%L,%L,%L) " +
			"ON CONFLICT (number,dept_name) DO UPDATE SET description=%L",
			course.name, course.description, course.number, course.deptName, course.description);
		// console.log(q);
		client.query(q, function (err) {
			if(err) return console.log(err);
			if(cb) cb();
		});
	}
	if(!savedDepts[course.deptName]) {
		saveDepartment(client, course, doIt);
	} else {
		doIt();
	}
}

function saveCoursePrerequisites(client, courses, course, cb) {
	var index = 0;
	function each() {
		var id = course.prerequisites[index++];
		if(!id) {
			if(cb) cb();
			return;
		}

		var prereq = courses[id];
		if(!prereq) {
			each();
			return;
		}

		var q = escape("INSERT INTO prerequisite VALUES(%L,%L,%L,%L)",
			course.number, course.deptName, prereq.number, prereq.deptName);
		// console.log(q);
		client.query(q, function (err) {
			if(err) return console.log(err);
			each();
		});
	}
	each();
}

function savePrerequisites(client, courses, ids, cb) {
	var index = 0;
	function each() {
		var id = ids[index++];
		if(!id) {
			if(cb) cb();
			return;
		}

		var course = courses[id];
		saveCoursePrerequisites(client, courses, course, function() {
			each();
		});
	}
	each();
}

console.log("Scraping courses");
scrape(function(courses, ids) {
	var client = new Client(config);
	client.connect();

	console.log("Saving courses");
	var index = 0;
	function each() {
		var id = ids[index++];
		if(!id) {
			savePrerequisites(client, courses, ids, function() {
				client.end();
			});
			return;
		}

		var course = courses[id];
		saveCourse(client, course, function() {
			each();
		});
	}
	each();
});
