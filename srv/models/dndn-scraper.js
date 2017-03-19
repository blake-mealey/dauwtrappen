var request = require("request");
var xml2js = require("xml2js");

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
				if(term.desc == "Summer 2016") {
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

	client.query("DELETE FROM faculty WHERE name='Dump'", function(err, result) {
		if(err) return console.log(err);

		client.query("INSERT INTO faculty VALUES('Dump')", function(err, result) {
			if(err) return console.log(err);

			client.end();
			if(cb) cb();
		});
	});
}

function saveSemester(semester, cb) {
	if(!semester) return;

	var client = new Client(config);
	client.connect();

	client.query("INSERT INTO semester VALUES(" + semester.name + ",'" + semester.desc + "') ON CONFLICT DO NOTHING", function (err, result) {
		if(err) return console.log(err);

		client.end();
		if(cb) cb();
	});
}

function saveDepartment(client, dept, cb) {
	client.query("INSERT INTO department VALUES('" + dept + "','" + dept + "') ON CONFLICT DO NOTHING", function (err, result) {
		if(err) return console.log(err);
		client.query("INSERT INTO faculty_contains VALUES('Dump','" + dept + "') ON CONFLICT DO NOTHING", function (err, result) {
			if(err) return console.log(err);
			cb();
		});
	});
}

function saveInstructor(client, name, cb) {
	client.query("INSERT INTO instructor VALUES('" + name + "') ON CONFLICT DO NOTHING", function (err, result) {
		if(err) return console.log(err);
		cb();
	});
}

var semesterId;
var sectionId = 0;
function saveSection(client, dept, courseNum, section, cb) {
	var q = "INSERT INTO course_section VALUES(" +
		"'" + ((section.$.type == "Lecture") ? "LEC" : (section.$.type == "Lab") ? "LAB" : "TUT") + "', " +
		semesterId + ", " +
		section.$.group + ", " +
		(section.time ? ("'" + section.time[0].$.day + section.time[0].$.time + "'") : "NULL") + ", " +
		"'" + section.room[0] + "', " +
		sectionId++ + ", " +
		"NULL, " +
		"'" + section.instructor + "', " +
		"'" + courseNum + "', " +
		"'" + dept + "'" +
		") ON CONFLICT DO NOTHING";
	// console.log(q);
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
	var name = course.description[0].replace(/'/g, '"');
	var dept = course.$.subject;
	saveDepartment(client, dept, function () {
		client.query("INSERT INTO course VALUES('" + name + "','" + name + "','" + num + "','" + dept + "') ON CONFLICT DO NOTHING", function (err, result) {
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

				section.instructor = section.instructor[0].replace(/'/g, '"');
				// console.log(section);
				saveInstructor(client, section.instructor, function() {
					saveSection(client, dept, num, section, each);
				});
			}
			each();
		});
	});
}

setupSave(scrapeSemesters);