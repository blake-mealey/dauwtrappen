const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/todo';

// const client = new pg.Client(connectionString);
// client.connect();

var config = {
  user: 'postgres', //env var: PGUSER 
  database: 'ddn_db',
  password: 'carrots', //env var: PGPASSWORD 
  host: 'localhost', // Server hosting the postgres database 
  port: 5432, //env var: PGPORT 
};

var pool = new pg.Pool(config);
pool.connect(function(err, client, done) {
	const query = client.query(
	  'CREATE TABLE items(id SERIAL PRIMARY KEY, text VARCHAR(40) not null, complete BOOLEAN)');
	query.on('end', () => { client.end(); });
});
