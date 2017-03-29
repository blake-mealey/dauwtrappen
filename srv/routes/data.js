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

		var list = [];
		for (var id in semesters) {
			if(!semesters.hasOwnProperty(id)) continue;
			list.push(semesters[id]);
		}

		res.send(list);
	});
});

//START:  Function that will return userName and password if they exist
//Cory did this
router.get('/userExists', function(req, res) {
// check arguments
	if(!req.query.email) {
		res.send(false);
		return;
	}

	if(!req.query.password) {
		res.send(false);
		return;
	}


// make database query
	var client = new Client(config);
	client.connect();

/*
	var q = escape("SELECT DISTINCT s.*, c.*, fc.faculty_name AS fac_name, d.full_name AS dept_full_name " +
		"FROM course as c, faculty_contains as fc, course_section as s, department as d " +
		"WHERE s.semester_id=%s AND s.dept_name=fc.dept_name AND c.number=s.course_num AND " +
		"c.dept_name=s.dept_name AND fc.faculty_name=%L AND d.name=s.dept_name",
		req.query.email, req.query.password);
*/
		
	var q = escape("SELECT email, password " +
		"FROM user_account " +
		"WHERE email=%L AND password=%L",
		req.query.email, req.query.password);
	client.query(q, function (err, result) {
		client.end();
		if(err) {
			console.log(err);
			res.send(error("Database error."));
			return;
		}
		
// do something with result.rows (the rows returned from sql query)
		
// send something back to the client
		res.send(result.rows.length == 1);

		
    });
});
//END:  Function that will return userName and password if they exist





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

	var q = escape("SELECT DISTINCT s.*, c.*, fc.faculty_name AS fac_name, d.full_name AS dept_full_name " +
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

			var level = Math.floor(Number(obj.course_num.substr(0,3))/100) * 100;
			if(!parent[level]) parent[level] = {};
			parent = parent[level];

			if(!parent[obj.course_num]) {
				parent[obj.course_num] = {
					dept_full_name: obj.dept_full_name,
					dept_name: obj.dept_name,
					description: obj.description,
					fac_name: obj.fac_name,
					name: obj.name,
					number: obj.course_num,
					sections: []
				};
			}
			parent = parent[obj.number];

			parent.sections.push({
				section_number: obj.number,
				type: obj.type,
				time: obj.time,
				location: obj.location,
				section_id: obj.id,
				instr_name: obj.ta_name || obj.instr_name
			});
		}

		res.send(courseData);
	});
});

module.exports = router;
