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

/* GET search page. */
router.get('/', function(req, res, next) {
	res.render('courses', { title: 'Dauwtrappen' });
});

router.get('/data', function(req, res, next) {
	var client = new Client(config);
	client.connect();
	client.query('SELECT * FROM public.course', function(err, result) {
		console.log(result.rows);
		client.end();

		res.send(result.rows);
	});
});

module.exports = router;
