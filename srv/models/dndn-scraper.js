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
				if(term.desc == "Fall 2017") {
					scrapeSemester(term.name);
				}
			}
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

function saveCourse(course, cb) {
	if(!course) return;

	var client = new Client(config);
	client.connect();

	var dept = course.$.subject;
	var num = course.$.number;
	var name = course.description[0].replace(/'/g, '"');
	client.query("SELECT * FROM department WHERE name='" + dept + "'", function(err, result) {
		if(err) return console.log(err);

		function insertCourse() {
			client.query("INSERT INTO course VALUES('" + name + "','" + name + "','" + num + "','" + dept + "')", function (err, result) {
				if(err) return console.log(err);
				client.end();
				if(cb) cb();
			})
		}

		if(result.rows.length == 0) {
			client.query("INSERT INTO department VALUES('" + dept + "','" + dept + "')", function (err, result) {
				if(err) return console.log(err);
				client.query("INSERT INTO faculty_contains VALUES('Dump','" + dept + "')", function (err, result) {
					if(err) return console.log(err);
					insertCourse();
				});
			});
		} else {
			insertCourse();
		}
	});
}

setupSave(scrapeSemesters);