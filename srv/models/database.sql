SET client_min_messages TO WARNING;

DROP TABLE IF EXISTS user_account CASCADE;
CREATE TABLE user_account(
	email text PRIMARY KEY,
	password VARCHAR(60)
);

DROP TABLE IF EXISTS schedule CASCADE;
CREATE TABLE schedule(
	id CHAR(36) PRIMARY KEY,
	name text,
	description text,
	owner_email text NOT NULL,
	FOREIGN KEY (owner_email) REFERENCES user_account(email) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS semester CASCADE;
CREATE TABLE semester(
	id int PRIMARY KEY,
	name text
);

DROP TABLE IF EXISTS faculty CASCADE;
CREATE TABLE faculty(
	name text PRIMARY KEY
);

DROP TABLE IF EXISTS department CASCADE;
CREATE TABLE department(
	name VARCHAR(4) PRIMARY KEY,
	full_name text
);

DROP TABLE IF EXISTS degree CASCADE;
CREATE TABLE degree(
	name text PRIMARY KEY,
	dept_name VARCHAR(4) NOT NULL,
	FOREIGN KEY (dept_name) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS teaching_assistant CASCADE;
CREATE TABLE teaching_assistant(
	name text PRIMARY KEY
);

DROP TABLE IF EXISTS instructor CASCADE;
CREATE TABLE instructor(
	name text PRIMARY KEY
);

DROP TABLE IF EXISTS course CASCADE;
CREATE TABLE course(
	name text,
	description text,
	number text,
	dept_name VARCHAR(4) NOT NULL,
	FOREIGN KEY (dept_name) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE,
	PRIMARY KEY (dept_name, number)
);

DROP TABLE IF EXISTS prerequisite CASCADE;
CREATE TABLE prerequisite(
	course_num text NOT NULL,
	course_dept VARCHAR(4) NOT NULL,
	prereq_num TEXT NOT NULL,
	prereq_dept VARCHAR(4) NOT NULL,
	FOREIGN KEY (course_dept, course_num) REFERENCES course(dept_name, number) ON DELETE CASCADE ON UPDATE CASCADE,
 	FOREIGN KEY (prereq_dept, prereq_num) REFERENCES course(dept_name, number) ON DELETE CASCADE ON UPDATE CASCADE
 );

DROP TYPE IF EXISTS section_type CASCADE;
CREATE TYPE section_type AS ENUM (
	'LEC',
	'TUT',
	'LAB'
);

DROP TABLE IF EXISTS course_section CASCADE;
CREATE TABLE course_section(
	type section_type,
	semester_id int,
	number smallint,
	time text,
	location text,
	id int PRIMARY KEY,
	ta_name text DEFAULT 'Staff',
	instr_name text DEFAULT 'Staff',
	course_num text NOT NULL,
	dept_name VARCHAR(4) NOT NULL,
	FOREIGN KEY (semester_id) REFERENCES semester(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (ta_name) REFERENCES teaching_assistant(name) ON DELETE SET DEFAULT ON UPDATE CASCADE,
	FOREIGN KEY (instr_name) REFERENCES instructor(name) ON DELETE SET DEFAULT ON UPDATE CASCADE,
	FOREIGN KEY (dept_name, course_num) REFERENCES course(dept_name, number) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS works_for CASCADE;
CREATE TABLE works_for(
	inst_name text NOT NULL,
	dept_name VARCHAR(4) NOT NULL,
	FOREIGN KEY (inst_name) REFERENCES instructor(name) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (dept_name) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS faculty_contains CASCADE;
CREATE TABLE faculty_contains(
	faculty_name text NOT NULL,
	dept_name VARCHAR(4) NOT NULL,
	FOREIGN KEY (faculty_name) REFERENCES faculty(name) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (dept_name) REFERENCES department(name) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS degree_require CASCADE;
CREATE TABLE degree_require(
	degree_name text NOT NULL,
	course_num text NOT NULL,
	dept_name VARCHAR(4) NOT NULL,
	gpa double precision,
	FOREIGN KEY (degree_name) REFERENCES degree(name) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (dept_name, course_num) REFERENCES course(dept_name, number) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS schedule_section CASCADE;
CREATE TABLE schedule_section(
	sched_id CHAR(36) NOT NULL,
	section_id int NOT NULL,
	FOREIGN KEY (sched_id) REFERENCES schedule(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (section_id) REFERENCES course_section(id) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS user_degree CASCADE;
CREATE TABLE user_degree(
	user_email text NOT NULL,
	degree_name text NOT NULL,
	FOREIGN KEY (user_email) REFERENCES user_account(email) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (degree_name) REFERENCES degree(name) ON DELETE CASCADE ON UPDATE CASCADE
);