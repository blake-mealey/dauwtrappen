const pg = require('pg');
const pgtools = require('pgtools');

var config = {
  user: 'postgres', //env var: PGUSER 
  // database: 'ddn_db',
  password: 'carrots', //env var: PGPASSWORD 
  host: 'localhost', // Server hosting the postgres database 
  port: 5432, //env var: PGPORT 
};

var database = 'ddn_db';

pgtools.dropdb(config, database, function(err, res) {
	if(err) {
		console.log(err);
	}

	pgtools.createdb(config, database, function(err, res) {
		if(err) {
			console.log(err);
		}

		config.database = database;
		createTables();
	});
});

function createTables() {
	var client;
	var endCount = 0;
	var queryCount = 2;
	function end() {
		if(++endCount >= queryCount) {
			client.end();
		}
	}

	var pool = new pg.Pool(config);
	pool.connect(function(err, cli, done) {
		client = cli;
		  
		  // 'CREATE TABLE user(id SERIAL PRIMARY KEY, text VARCHAR(40) not null, complete BOOLEAN)');

		const query1 = client.query(
		  'CREATE TABLE user_account(email VARCHAR(100) PRIMARY KEY, password CHAR(60))');
		query1.on('error', (err) => { console.log(err) });
		query1.on('end', end);

		const query2 = client.query(
		  'CREATE TABLE user_account(email VARCHAR(100) PRIMARY KEY, password CHAR(60))');
		query2.on('error', (err) => { console.log(err) });
		query2.on('end', end);


	});
}