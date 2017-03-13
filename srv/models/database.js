const pg = require('pg');

var config = {
	user: 'postgres', //env var: PGUSER 
	database: 'ddn_db',
	password: 'carrots', //env var: PGPASSWORD 
	host: 'localhost', // Server hosting the postgres database 
	port: 5432 //env var: PGPORT
};

var client;

var endCount = 0;
var queryCount = 15*2;

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

new pg.Pool(config).connect(function(err, c) {
    client = c;

    query('DROP TABLE IF EXISTS user_account CASCADE');
    query('CREATE TABLE user_account(' +
        'email text PRIMARY KEY,' +
        'password VARCHAR(60)' +
        ')');

    query('DROP TABLE IF EXISTS schedule CASCADE');
    query('CREATE TABLE schedule(' +
        'id CHAR(36) PRIMARY KEY,' +
        'name text,' +
        'description text,' +
        'ownerEmail text NOT NULL,' +
        'FOREIGN KEY (ownerEmail) REFERENCES user_account(email) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')');

    query('DROP TABLE IF EXISTS faculty CASCADE');
    query('CREATE TABLE faculty(' +
        'name text PRIMARY KEY' +
        ')');

    query('DROP TABLE IF EXISTS department CASCADE');
    query('CREATE TABLE department(' +
        'name CHAR(4) PRIMARY KEY' +
        ')');

    query('DROP TABLE IF EXISTS degree CASCADE');
    query('CREATE TABLE degree(' +
        'name text PRIMARY KEY,' +
        'deptName CHAR(4) NOT NULL,' +
        'FOREIGN KEY (deptName) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')');

    query('DROP TABLE IF EXISTS ta CASCADE');
    query('CREATE TABLE ta(' +
        'name text PRIMARY KEY' +
        ')');

    query('DROP TABLE IF EXISTS instructor CASCADE');
    query('CREATE TABLE instructor(' +
        'name text PRIMARY KEY' +
        ')');

    query('DROP TABLE IF EXISTS course CASCADE');
    query('CREATE TABLE course(' +
        'name text,' +
        'description text,' +
        'number smallint,' +
        'deptName CHAR(4) NOT NULL,' +
        'FOREIGN KEY (deptName) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE,' +
        'PRIMARY KEY (deptName, number)' +
        ')');

    query('DROP TYPE IF EXISTS section_type CASCADE');
    query('CREATE TYPE section_type AS ENUM (\'lecture\', \'tutorial\', \'lab\')');

    query('DROP TABLE IF EXISTS course_section CASCADE');
    query('CREATE TABLE course_section(' +
        'type section_type,' +
        'number smallint,' +
        'time text,' +      // TODO: Determine type
        'location text,' +
        'semester int,' +
        'id int PRIMARY KEY,' +
        'taName text DEFAULT \'Staff\',' +
        'instrName text DEFAULT \'Staff\',' +
        'courseNum smallint NOT NULL,' +
        'deptName CHAR(4) NOT NULL,' +
        'FOREIGN KEY (taName) REFERENCES ta(name) ON DELETE SET DEFAULT ON UPDATE CASCADE,' +
        'FOREIGN KEY (instrName) REFERENCES instructor(name) ON DELETE SET DEFAULT ON UPDATE CASCADE,' +
        'FOREIGN KEY (deptName, courseNum) REFERENCES course(deptName, number) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')');

    query('DROP TABLE IF EXISTS works_for CASCADE');
    query('CREATE TABLE works_for(' +
        'instName text NOT NULL,' +
        'deptName CHAR(4) NOT NULL,' +
        'FOREIGN KEY (instName) REFERENCES instructor(name) ON DELETE CASCADE ON UPDATE CASCADE,' +
        'FOREIGN KEY (deptName) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')');

    query('DROP TABLE IF EXISTS faculty_contains CASCADE');
    query('CREATE TABLE faculty_contains(' +
        'facultyName text NOT NULL,' +
        'deptName CHAR(4) NOT NULL,' +
        'FOREIGN KEY (facultyName) REFERENCES faculty(name) ON DELETE CASCADE ON UPDATE CASCADE,' +
        'FOREIGN KEY (deptName) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')');

    query('DROP TABLE IF EXISTS degree_require CASCADE');
    query('CREATE TABLE degree_require(' +
        'degreeName text NOT NULL,' +
        'courseNum smallint NOT NULL,' +
        'deptName CHAR(4) NOT NULL,' +
        'gpa double precision,' +       // TODO: Default?
        'FOREIGN KEY (degreeName) REFERENCES degree(name) ON DELETE CASCADE ON UPDATE CASCADE,' +
        'FOREIGN KEY (deptName, courseNum) REFERENCES course(deptName, number) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')');

    query('DROP TABLE IF EXISTS schedule_section CASCADE');
    query('CREATE TABLE schedule_section(' +
        'schedId CHAR(36) NOT NULL,' +
        'sectionId int NOT NULL,' +
        'FOREIGN KEY (schedId) REFERENCES schedule(id) ON DELETE CASCADE ON UPDATE CASCADE,' +
        'FOREIGN KEY (sectionId) REFERENCES course_section(id) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')');

    query('DROP TABLE IF EXISTS user_degree CASCADE');
    query('CREATE TABLE user_degree(' +
        'userEmail text NOT NULL,' +
        'degreeName text NOT NULL,' +
        'FOREIGN KEY (userEmail) REFERENCES user_account(email) ON DELETE CASCADE ON UPDATE CASCADE,' +
        'FOREIGN KEY (degreeName) REFERENCES degree(name) ON DELETE CASCADE ON UPDATE CASCADE' +
        ')');
});
