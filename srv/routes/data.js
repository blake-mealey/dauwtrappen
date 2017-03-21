var express = require('express');
var router = express.Router();
var escape = require('pg-escape');

var Client = require("pg").Client;

var config = {
	user: "postgres", //env var: PGUSER
	database: "ddn_db",
	password: "carrots", //env var: PGPASSWORD
	host: "localhost", // Server hosting the postgres database
	port: 5432 //env var: PGPORT
};

function error(msg) {		// TODO: Better error messages (machine-readable)
	return {
		error: msg
	};
}

router.get('/semesters', function(req, res) {
	var client = new Client(config);
	client.connect();

	var q = escape("SELECT s.*, f.name as fac_name FROM faculty as f, faculty_contains as fc, course_section as c, semester as s WHERE " +
		"c.semester_id=s.id AND c.dept_name=fc.dept_name AND f.name=fc.faculty_name GROUP BY s.id, f.name");
	console.log(q);
	client.query(q, function(err, result) {
		client.end();
		if(err) {
			console.log(err);
			res.send(error("Database error."));
			return;
		}

		var semesters = {};
		for (var i = 0; i < result.rows.length; i++) {
			var obj = result.rows[i];
			if(!semesters[obj.id]) {
				semesters[obj.id] = {
					id: obj.id,
					name: obj.name,
					faculties: []
				};
			}
			semesters[obj.id].faculties.push(obj.fac_name);
			semesters[obj.id].faculties.sort();
		}

		res.send(semesters);
	});
});

router.get('/courses', function(req, res) {
	if(!req.query.semesterId) {
		res.send("No semester ID");
		return;
	}

	if(!req.query.facultyName) {
		res.send("No faculty name");
		return;
	}

	var client = new Client(config);
	client.connect();

	var q = escape("SELECT DISTINCT c.*, fc.faculty_name AS fac_name, d.full_name AS dept_full_name " +
		"FROM course as c, faculty_contains as fc, course_section as s, department as d " +
		"WHERE s.semester_id=%s AND s.dept_name=fc.dept_name AND c.number=s.course_num AND " +
		"c.dept_name=s.dept_name AND fc.faculty_name=%L AND d.name=s.dept_name",
		req.query.semesterId, req.query.facultyName);
	client.query(q, function (err, result) {
		client.end();
		if(err) {
			console.log(err);
			res.send(error("Database error."));
			return;
		}

		var courseData = {};
		for (var i = 0; i < result.rows.length; i++) {
			var obj = result.rows[i];
			var parent = courseData;

			if(!parent[obj.dept_name]) parent[obj.dept_name] = {};
			parent = parent[obj.dept_name];

			var level = Math.floor(Number(obj.number.substr(0,3))/100) * 100;
			if(!parent[level]) parent[level] = [];
			parent = parent[level];

			parent.push(obj);
		}

		res.send(courseData);
	});
});

module.exports = router;
