var request = require("request");
var xml2js = require("xml2js");
var escape = require('pg-escape');

var Client = require("pg").Client;

var config = {
	user: "postgres", //env var: PGUSER
	database: "ddn_db",
	password: "carrots", //env var: PGPASSWORD
	host: "localhost", // Server hosting the postgres database
	port: 5432 //env var: PGPORT
};

var baseUrl = "http://dndn.ethv.net/database/";
var semestersList = "termlist.xml";

function scrapeSemesters() {
	request(baseUrl + semestersList, function (err, res) {
		if (err) return console.log("Request error: " + err);
		if (res.statusCode != 200) return console.log("Status code not 200: " + res.statusCode);

		xml2js.parseString(res.body, function (err, data) {
			if (err) return console.log("Parsing error: " + err);

			data = data.termlist.term;

			var index = 0;
			function each() {
				if(data[index]) {
					var term = data[index++].$;
					if(term.desc == "Spring 2017") {
						console.log(term.desc);
						semesterId = term.name;
						saveSemester(term, function () {
							scrapeSemester(term.name, each);
						});
					} else {
						each();
					}
				}
			}
			each();
		});
	});
}

function scrapeSemester(name, cb) {
	request(baseUrl + name + ".xml", function (err, res) {
		if (err) return console.log("Request error: " + err);
		if (res.statusCode != 200) return console.log("Status code not 200: " + res.statusCode);

		xml2js.parseString(res.body, function (err, courses) {
			if (err) return console.log("Parsing error: " + err);

			courses = courses.coursedetails.course;
			var index = 0;
			function each() {
				if(!courses[index]) {
					if(cb) cb();
				} else {
					saveCourse(courses[index++], each);
				}
			}
			each();
		});
	});
}

function setupSave(cb) {
	var client = new Client(config);
	client.connect();

	client.query("DELETE FROM faculty", function(err) {
		if(err) return console.log(err);

		client.end();
		if(cb) cb();
	});
}

function saveSemester(semester, cb) {
	if(!semester) return;

	var client = new Client(config);
	client.connect();

	var q = escape("INSERT INTO semester VALUES(%s,%L) ON CONFLICT DO NOTHING", semester.name, semester.desc);
	// console.log(q);
	client.query(q, function (err) {
		if(err) return console.log(err);

		client.end();
		if(cb) cb();
	});
}

function saveFaculty(client, faculty, cb) {
	var q = escape("INSERT INTO faculty VALUES(%L) ON CONFLICT DO NOTHING", faculty);
	// console.log(q);
	client.query(q, function(err) {
		if(err) return console.log(err);
		cb();
	});
}

function saveDepartment(client, dept, cb) {
	var faculty = dept[0];
	saveFaculty(client, faculty, function() {
		var q = escape("INSERT INTO department VALUES(%L,%L) ON CONFLICT DO NOTHING", dept, dept);
		// console.log(q);
		client.query(q, function (err) {
			if(err) return console.log(err);
			q = escape("INSERT INTO faculty_contains VALUES(%L,%L) ON CONFLICT DO NOTHING", faculty, dept);
			// console.log(q);
			client.query(q, function (err) {
				if(err) return console.log(err);
				cb();
			});
		});
	});
}

function saveInstructor(client, name, cb) {
	var q = escape("INSERT INTO instructor VALUES(%L) ON CONFLICT DO NOTHING", name);
	// console.log(q);
	client.query(q, function (err) {
		if(err) return console.log(err);
		cb();
	});
}

var semesterId;
var sectionId = 0;
function saveSection(client, dept, courseNum, section, cb) {
	var type = ((section.$.type == "Lecture") ? "LEC" : (section.$.type == "Lab") ? "LAB" : "TUT");
	var timeString = "";
	if(section.time) {
		for (var i = 0; i < section.time.length; i++) {
			var time = section.time[i];
			var times = time.$.time.split(" - ");
			timeString += (time.$.day + "," + times[0] + "," + times[1] + ".");
		}
	}
	// var time = (section.time ? ("'" + section.time[0].$.day + section.time[0].$.time + "'") : "NULL");
	var q = escape("INSERT INTO course_section VALUES(%L,%s,%s,%L,%L,%s,NULL,%L,%L,%L) ON CONFLICT DO NOTHING",
		type, semesterId, section.$.name, timeString, section.room[0], sectionId++, section.instructor, courseNum, dept);
	// console.log(q);
	client.query(q, function (err) {
		if(err) return console.log(err);
		cb();
	});
}

function saveCourse(course, cb) {
	if(!course) return;

	var client = new Client(config);
	client.connect();

	var num = course.$.number;
	var name = course.description[0];
	var dept = course.$.subject;
	saveDepartment(client, dept, function () {
		var q = escape("INSERT INTO course VALUES(%L,%L,%L,%L) ON CONFLICT DO NOTHING", name, name, num, dept);
		// console.log(q);
		client.query(q, function (err) {
			if(err) return console.log(err);

			var sections = course.periodic;
			var index = 0;
			function each() {
				var section = sections[index++];
				if(!section){
					client.end();
					if(cb) cb();
					return;
				}

				section.instructor = section.instructor[0];
				saveInstructor(client, section.instructor, function() {
					saveSection(client, dept, num, section, each);
				});
			}
			each();
		});
	});
}

setupSave(scrapeSemesters);