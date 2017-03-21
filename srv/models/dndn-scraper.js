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
			for(var termName in data) {
				if(!data.hasOwnProperty(termName)) continue;
				var term = data[termName].$;
				if(term.desc == "Winter 2018") {
					break;
				}
			}

			semesterId = term.name;
			saveSemester(term, function () {
				scrapeSemester(term.name);
			});
		});
	});
}

function scrapeSemester(name) {
	request(baseUrl + name + ".xml", function (err, res) {
		if (err) return console.log("Request error: " + err);
		if (res.statusCode != 200) return console.log("Status code not 200: " + res.statusCode);

		xml2js.parseString(res.body, function (err, courses) {
			if (err) return console.log("Parsing error: " + err);

			courses = courses.coursedetails.course;
			var index = 0;
			function each() {
				saveCourse(courses[index++], each);
			}
			each();
		});
	});
}

function setupSave(cb) {
	var client = new Client(config);
	client.connect();

	client.query("DELETE FROM faculty", function(err, result) {
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
	console.log(q);
	client.query(q, function (err, result) {
		if(err) return console.log(err);

		client.end();
		if(cb) cb();
	});
}

function saveFaculty(client, faculty, cb) {
	var q = escape("INSERT INTO faculty VALUES(%L) ON CONFLICT DO NOTHING", faculty);
	console.log(q);
	client.query(q, function(err, result) {
		if(err) return console.log(err);
		cb();
	});
}

function saveDepartment(client, dept, cb) {
	var faculty = dept[0];
	saveFaculty(client, faculty, function() {
		var q = escape("INSERT INTO department VALUES(%L,%L) ON CONFLICT DO NOTHING", dept, dept);
		console.log(q);
		client.query(q, function (err, result) {
			if(err) return console.log(err);
			q = escape("INSERT INTO faculty_contains VALUES(%L,%L) ON CONFLICT DO NOTHING", faculty, dept);
			console.log(q);
			client.query(q, function (err, result) {
				if(err) return console.log(err);
				cb();
			});
		});
	});
}

function saveInstructor(client, name, cb) {
	var q = escape("INSERT INTO instructor VALUES(%L) ON CONFLICT DO NOTHING", name);
	console.log(q);
	client.query(q, function (err, result) {
		if(err) return console.log(err);
		cb();
	});
}

var semesterId;
var sectionId = 0;
function saveSection(client, dept, courseNum, section, cb) {
	var type = ((section.$.type == "Lecture") ? "LEC" : (section.$.type == "Lab") ? "LAB" : "TUT");
	var time = (section.time ? ("'" + section.time[0].$.day + section.time[0].$.time + "'") : "NULL");
	var q = escape("INSERT INTO course_section VALUES(%L,%s,%s,%s,%L,%s,NULL,%L,%L,%L) ON CONFLICT DO NOTHING",
		type, semesterId, section.$.name, time, section.room[0], sectionId++, section.instructor, courseNum, dept);
	console.log(q);
	client.query(q, function (err, result) {
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
		console.log(q);
		client.query(q, function (err, result) {
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