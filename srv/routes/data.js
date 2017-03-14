var express = require('express');
var router = express.Router();

var Client = require("pg").Client;

var config = {
	user: "postgres", //env var: PGUSER
	database: "ddn_db",
	password: "carrots", //env var: PGPASSWORD
	host: "localhost", // Server hosting the postgres database
	port: 5432 //env var: PGPORT
};

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
			res.send(null);
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
		console.log(JSON.stringify(courseData));

		res.send(courseData);
	});
});

module.exports = router;
