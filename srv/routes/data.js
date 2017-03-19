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

	var q = escape("SELECT * FROM semester");
	client.query(q, function(err, result) {
		client.end();
		if(err) {
			res.send(error("Database error."));
			return;
		}

		res.send(result.rows);
	});
});

router.get('/faculties', function(req, res) {
	if(!req.query.semesterId) {
		res.send("No semester ID");
		return;
	}

	var client = new Client(config);
	client.connect();

	var q = escape("SELECT f.* FROM faculty as f WHERE EXISTS (" +
		"SELECT 1 FROM faculty_contains as fc, course_section as c WHERE " +
		"c.semester_id=%s AND " +
		"c.dept_name=fc.dept_name AND " +
		"f.name=fc.faculty_name)", req.query.semesterId);
	console.log(q);
	client.query(q, function(err, result) {

		client.end();
		if(err) {
			console.log(err);
			res.send("Database error.");
			return;
		}

		res.send(result.rows);
	})
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

	var q = escape("SELECT c.* FROM course as c, faculty_contains as fc, course_section as s WHERE " +
		"s.semester_id=%s AND " +
		"s.dept_name=fc.dept_name AND " +
		"c.number=s.course_num AND " +
		"c.dept_name=s.dept_name AND " +
		"fc.faculty_name=%L", req.query.semesterId, req.query.facultyName);
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

			// if(!courseData[obj.fac_name]) courseData[obj.fac_name] = {};
			// parent = courseData[obj.fac_name];

			if(!parent[obj.dept_name]) parent[obj.dept_name] = {};
			parent = parent[obj.dept_name];

			var level = Math.floor(obj.number/100) * 100;
			if(!parent[level]) parent[level] = [];
			parent = parent[level];

			parent.push(obj);
		}

		res.send(courseData);
	});
});

/*
router.get('/courses', function(req, res, next) {
	var client = new Client(config);
	client.connect();

	client.query('SELECT f.name AS fac_name, d.name AS dept_name, d.full_name AS dept_full_name, c.* ' +
		'FROM public.faculty AS f, public.department AS d, public.course as c ' +
		'WHERE ' +
		'EXISTS (SELECT * ' +
		'FROM public.faculty_contains ' +
		'WHERE faculty_name=f.name AND dept_name=d.name) ' +
		'AND c.dept_name=d.name', function (err, result) {

		client.end();
		if(err) {
			res.send(error("Database error."));
			return;
		}

		var courseData = {};
		for (var i = 0; i < result.rows.length; i++) {
			var obj = result.rows[i];
			var parent = courseData;

			if(!courseData[obj.fac_name]) courseData[obj.fac_name] = {};
			parent = courseData[obj.fac_name];

			if(!parent[obj.dept_name]) parent[obj.dept_name] = {};
			parent = parent[obj.dept_name];

			var level = Math.floor(obj.number/100) * 100;
			if(!parent[level]) parent[level] = [];
			parent = parent[level];

			parent.push(obj);
		}

		res.send(courseData);
	});
});
*/

module.exports = router;
