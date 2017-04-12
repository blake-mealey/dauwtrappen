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

var DB_ERROR = "DATABASE_ERROR";
var ARG_MISSING = "ARGUMENT_MISSING";

function error(msg, val) {
	return {
		ok: false,
		error: msg,
		val: val
	};
}

function success(data) {
	data.ok = true;
	return data;
}

router.get('/semesters', function(req, res) {
	var client = new Client(config);
	client.connect();

	var combined = req.query.combined === "true";

	var q;
	if(combined) {
		q = escape("SELECT s.*, f.name as fac_name FROM faculty as f, faculty_contains as fc, course_section as c, semester as s WHERE " +
			"c.semester_id=s.id AND c.dept_name=fc.dept_name AND f.name=fc.faculty_name GROUP BY s.id, f.name");
	} else {
		q = escape("SELECT s.* FROM semester as s");
	}

	console.log(q);
	client.query(q, function(err, result) {
		if(err) {
			console.log(err);
			res.send(error(DB_ERROR));
			return;
		}

		if(combined) {
			client.end();

			var semesters = {};
			for (var i = 0; i < result.rows.length; i++) {
				var obj = result.rows[i];
				if (!semesters[obj.id]) {
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
				if (!semesters.hasOwnProperty(id)) continue;
				list.push(semesters[id]);
			}

			res.send(success({
				semesters: list
			}));
		} else {
			var semesterList = [];
			for(var j = 0; j < result.rows.length; j++) {
				semesterList.push(result.rows[j]);
			}

			var q = escape("SELECT f.* FROM faculty as f");
			console.log(q);
			client.query(q, function(err, result) {
				client.end();
				if(err) {
					console.log(err);
					res.send(error(DB_ERROR));
					return;
				}

				var facultyList = [];
				for(var i = 0; i < result.rows.length; i++) {
					facultyList.push(result.rows[i].name);
				}

				res.send(success({
					semesters: semesterList,
					faculties: facultyList
				}));
			});
		}
	});
});

router.get('/courses', function(req, res) {
	if(!req.query.facultyName) {
		res.send(error(ARG_MISSING, "FACULTY_NAME"));
		return;
	}

	var client = new Client(config);
	client.connect();

	var q;
	if(req.query.semesterId) {
		q = escape("SELECT DISTINCT s.*, c.*, fc.faculty_name AS fac_name, d.full_name AS dept_full_name " +
			"FROM course as c, faculty_contains as fc, course_section as s, department as d " +
			"WHERE s.semester_id=%s AND s.dept_name=fc.dept_name AND c.number=s.course_num AND " +
			"c.dept_name=s.dept_name AND fc.faculty_name=%L AND d.name=s.dept_name",
			req.query.semesterId, req.query.facultyName);
	} else {
		q = escape("SELECT DISTINCT s.*, c.*, fc.faculty_name AS fac_name, d.full_name AS dept_full_name " +
			"FROM course as c, faculty_contains as fc, course_section as s, department as d " +
			"WHERE s.dept_name=fc.dept_name AND c.number=s.course_num AND " +
			"c.dept_name=s.dept_name AND fc.faculty_name=%L AND d.name=s.dept_name",
			req.query.facultyName);
	}
	console.log(q);
	client.query(q, function (err, result) {
		client.end();
		if(err) {
			console.log(err);
			res.send(error(DB_ERROR));
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
					sections: [],
					semesters: []
				};
			}
			parent = parent[obj.course_num];

			parent.sections.push({
				section_number: obj.number,
				type: obj.type,
				time: obj.time,
				location: obj.location,
				section_id: obj.id,
				instr_name: obj.ta_name || obj.instr_name,
				semester_id: obj.semester_id
			});

			if(parent.semesters.indexOf(obj.semester_id) == -1) {
				parent.semesters.push(obj.semester_id);
			}
		}

		res.send(success({
			courses: courseData
		}));
	});
});










//START:  Function that will return userName and password if they exist
//Cory did this
router.get('/login', function(req, res) {
// check arguments
	if(!req.query.email) {
		res.send("NE");
		return;
	}

	if(!req.query.password) {
		res.send("NP");
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
		if(result.rows.length == 1)
		{
			res.send("LI");
		}
		else
		{
			res.send("ILI");
		}

		
    });
});
//END:  Function that will return userName and password if they exist


//START:  Function for assisting in account creation
router.get('/createAccount', function(req, res) {
// check arguments
	if(!req.query.email) {
		res.send("IEE");
		return;
	}

	if(!req.query.password) {
		res.send("IPE");
		return;
	}


// make database query
	var client = new Client(config);
	client.connect();

		
	//START: creates query and gets results
	var q = escape("SELECT email " +
		"FROM user_account " +
		"WHERE email=%L ",
		req.query.email);
	client.query(q, function (err, result)
	{
		if(err) {
			client.end();
			console.log(err);
			res.send(error("Database error."));
			return;
		}
			
		//START: if statement for returning if username already exists
		if(result.rows.length == 1)
		{
			client.end();
			res.send("EIU"); //return false cause email is in use
			return;
		}
		//END: if statement for returning if username already exists
		else
		{
			var q = escape("INSERT " +
				"INTO user_account " +
				"VALUES (%L,%L) ",
				req.query.email,req.query.password);
	
			client.query(q, function (err, result)
			{
				client.end();
				if(err) {
					console.log(err);
					res.send(error("Database error."));
					return;
				}
			
				res.send("AC");
				return;
			});
		}
    });
	//END: creates query and gets results
});
//END:  Function for assisting in account creation

router.get('/loadSchedule', function(req, res) {
	console.log("Schedule load called");

	//Load the schedule with id 1
	var client = new Client(config);
	client.connect();

	var q = escape("SELECT s.*, c.*, cs.* " +
		"FROM schedule AS s, course AS c, course_section AS cs, schedule_section AS ss " + 
		"WHERE s.id=%L AND ss.sched_id=s.id AND cs.id = ss.section_id AND c.number = cs.course_num AND c.dept_name = cs.dept_name",
		"1");

	client.query(q, function (err, result1) {
		if(err) {
			console.log(err);
			client.end();
			res.send(error(DB_ERROR));
			return;
		}

		q = escape("SELECT DISTINCT cs2.* " +
		"FROM schedule AS s, course AS c, course_section AS cs, course_section AS cs2, schedule_section AS ss " + 
		"WHERE s.id=%L AND ss.sched_id=s.id AND cs.id = ss.section_id AND c.number = cs.course_num AND c.dept_name = cs.dept_name AND " +
		"cs2.dept_name = c.dept_name AND cs2.course_num = c.number AND cs2.semester_id = cs.semester_id",
		"1");
		client.query(q, function (err, result2) {
			client.end();
			if(err) {
				console.log(err);
				res.send(error(DB_ERROR));
				return;
			}

			res.send(success({schedule: result1.rows, sections: result2.rows}));
		});
	});
});

//Checks if the given value is an array or not
function check_array (value) {
    return value && typeof value === 'object' && value.constructor === Array;
}

router.post('/saveSchedule', function (req, res) {
	console.log(req.body);

	if(!req.body.scheduleName) {
		res.send(error(ARG_MISSING, "SCHEDULE_NAME"));
		return;
	}

	if(!req.body["sections[]"]) {
		res.send(error(ARG_MISSING, "SECTIONS"));
		return;
	}

	//Solves the 1 element array issue where if only 1 section is selected, then this wont be an array, it will be a string
	if (!check_array(req.body["sections[]"])) {
		var temp = req.body["sections[]"];
		req.body["sections[]"] = [];
		req.body["sections[]"].push(temp);
	}

	var client = new Client(config);
	client.connect();
	console.log(req.body);

	//START: creates query and gets results
	var q = escape("INSERT INTO schedule " +
		"VALUES ('1',%L,'DESCRIPTION','blakemealey@gmail.com')",
		req.body.scheduleName);
	client.query(q, function (err, result) {
		if(err) {
			console.log(err);
			res.send(error(DB_ERROR));
			return;
		}

		var index = 0;
		function each() {
			var element = req.body["sections[]"][index++];
			if(!element) {
				client.end();
				res.send(success({}));
				return;
			}

			console.log(element);
			var q = escape("INSERT INTO schedule_section " +
				"VALUES ('1',%s)",
				element);
			client.query(q, function(err, result) {
				if(err) {
					console.log(err);
					res.send(error(DB_ERROR));
					return;
				}

				each();
			});
		}
		each();
	});
});



module.exports = router;
