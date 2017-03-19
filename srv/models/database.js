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
var queryCount = 16*2;

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

	// RECREATE TABLES

	query("DROP TABLE IF EXISTS user_account CASCADE");
	query("CREATE TABLE user_account(" +
		"email text PRIMARY KEY," +
		"password VARCHAR(60)" +
		")");

	query("DROP TABLE IF EXISTS schedule CASCADE");
	query("CREATE TABLE schedule(" +
		"id CHAR(36) PRIMARY KEY," +
		"name text," +
		"description text," +
		"owner_email text NOT NULL," +
		"FOREIGN KEY (owner_email) REFERENCES user_account(email) ON DELETE CASCADE ON UPDATE CASCADE" +
		")");

	query("DROP TABLE IF EXISTS semester CASCADE");
	query("CREATE TABLE semester(" +
		"id int PRIMARY KEY," +
		"name text" +	// TODO: start and end dates (?)
		")");

	query("DROP TABLE IF EXISTS faculty CASCADE");
	query("CREATE TABLE faculty(" +
		"name text PRIMARY KEY" +
		")");

	query("DROP TABLE IF EXISTS department CASCADE");
	query("CREATE TABLE department(" +
		"name CHAR(4) PRIMARY KEY," +
		"full_name text" +
		")");

	query("DROP TABLE IF EXISTS degree CASCADE");
	query("CREATE TABLE degree(" +
		"name text PRIMARY KEY," +
		"dept_name CHAR(4) NOT NULL," +
		"FOREIGN KEY (dept_name) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE" +
		")");

	query("DROP TABLE IF EXISTS teaching_assistant CASCADE");
	query("CREATE TABLE teaching_assistant(" +
		"name text PRIMARY KEY" +
		")");

	query("DROP TABLE IF EXISTS instructor CASCADE");
	query("CREATE TABLE instructor(" +
		"name text PRIMARY KEY" +
		")");

	query("DROP TABLE IF EXISTS course CASCADE");
	query("CREATE TABLE course(" +
		"name text," +
		"description text," +
		"number text," +
		"dept_name CHAR(4) NOT NULL," +
		"FOREIGN KEY (dept_name) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE," +
		"PRIMARY KEY (dept_name, number)" +
		")");

	query("DROP TYPE IF EXISTS section_type CASCADE");
	query("CREATE TYPE section_type AS ENUM ('LEC', 'TUT', 'LAB')");

	query("DROP TABLE IF EXISTS course_section CASCADE");
	query("CREATE TABLE course_section(" +
		"type section_type," +
		"semester_id int," +
		"number smallint," +
		"time text," +      // TODO: Determine type
		"location text," +
		"id int PRIMARY KEY," +
		"ta_name text DEFAULT 'Staff'," +
		"instr_name text DEFAULT 'Staff'," +
		"course_num text NOT NULL," +
		"dept_name CHAR(4) NOT NULL," +
		"FOREIGN KEY (semester_id) REFERENCES semester(id) ON DELETE CASCADE ON UPDATE CASCADE," +
		"FOREIGN KEY (ta_name) REFERENCES teaching_assistant(name) ON DELETE SET DEFAULT ON UPDATE CASCADE," +
		"FOREIGN KEY (instr_name) REFERENCES instructor(name) ON DELETE SET DEFAULT ON UPDATE CASCADE," +
		"FOREIGN KEY (dept_name, course_num) REFERENCES course(dept_name, number) ON DELETE CASCADE ON UPDATE CASCADE" +
		")");

	query("DROP TABLE IF EXISTS works_for CASCADE");
	query("CREATE TABLE works_for(" +
		"inst_name text NOT NULL," +
		"dept_name CHAR(4) NOT NULL," +
		"FOREIGN KEY (inst_name) REFERENCES instructor(name) ON DELETE CASCADE ON UPDATE CASCADE," +
		"FOREIGN KEY (dept_name) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE" +
		")");

	query("DROP TABLE IF EXISTS faculty_contains CASCADE");
	query("CREATE TABLE faculty_contains(" +
		"faculty_name text NOT NULL," +
		"dept_name CHAR(4) NOT NULL," +
		"FOREIGN KEY (faculty_name) REFERENCES faculty(name) ON DELETE CASCADE ON UPDATE CASCADE," +
		"FOREIGN KEY (dept_name) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE" +
		")");

	query("DROP TABLE IF EXISTS degree_require CASCADE");
	query("CREATE TABLE degree_require(" +
		"degree_name text NOT NULL," +
		"course_num text NOT NULL," +
		"dept_name CHAR(4) NOT NULL," +
		"gpa double precision," +       // TODO: Default?
		"FOREIGN KEY (degree_name) REFERENCES degree(name) ON DELETE CASCADE ON UPDATE CASCADE," +
		"FOREIGN KEY (dept_name, course_num) REFERENCES course(dept_name, number) ON DELETE CASCADE ON UPDATE CASCADE" +
		")");

	query("DROP TABLE IF EXISTS schedule_section CASCADE");
	query("CREATE TABLE schedule_section(" +
		"sched_id CHAR(36) NOT NULL," +
		"section_id int NOT NULL," +
		"FOREIGN KEY (sched_id) REFERENCES schedule(id) ON DELETE CASCADE ON UPDATE CASCADE," +
		"FOREIGN KEY (section_id) REFERENCES course_section(id) ON DELETE CASCADE ON UPDATE CASCADE" +
		")");

	query("DROP TABLE IF EXISTS user_degree CASCADE");
	query("CREATE TABLE user_degree(" +
		"user_email text NOT NULL," +
		"degree_name text NOT NULL," +
		"FOREIGN KEY (user_email) REFERENCES user_account(email) ON DELETE CASCADE ON UPDATE CASCADE," +
		"FOREIGN KEY (degree_name) REFERENCES degree(name) ON DELETE CASCADE ON UPDATE CASCADE" +
		")");
});

