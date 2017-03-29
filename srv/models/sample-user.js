const pg = require("pg");

var config = {
	user: "postgres", //env var: PGUSER
	database: "ddn_db",
	password: "carrots", //env var: PGPASSWORD
	host: "localhost", // Server hosting the postgres database
	port: 5432 //env var: PGPORT
};

var client;

var endCount = 0;
var queryCount = 1;

function end(force) {
	if(++endCount >= queryCount || force) {
		client.end();
	}
}

function query(str) {
	client.query(str, function (err, res) {
		if (err) {
			console.log("Error executing query '" + str + "':");
			console.log(err);
			end(true);
		} else {
			console.log("Successfully executed query '" + str + "':");
			// console.log(res);
			end(false);
		}
	});
}

new pg.Pool(config).connect(function (err, c) {
	client = c;

	// INSERT TEST DATA
	query("INSERT INTO user_account VALUES(" +
		"'blake', 'pass')");
});

