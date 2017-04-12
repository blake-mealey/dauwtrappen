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
var queryCount = 27;

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

	query("INSERT INTO semester VALUES(" +
		"1234, 'Fall 2017')");

	query("INSERT INTO user_account VALUES(" +
		"'blakemealey@gmail.com', 'pass')");

	query("INSERT INTO faculty VALUES(" +
		"'Science')");

	query("INSERT INTO faculty VALUES(" +
		"'Arts')");

	query("INSERT INTO department VALUES(" +
		"'CPSC', 'Computer Science')");

	query("INSERT INTO department VALUES(" +
		"'ENGL', 'English')");

	query("INSERT INTO faculty_contains VALUES(" +
		"'Science', 'CPSC')");

	query("INSERT INTO faculty_contains VALUES(" +
		"'Arts', 'ENGL')");

	var desc = "An introduction to the Unix operating system, including the text editor \"emacs,\" its programming modes and macros; shell usage (including \"sh\" and \"tcsh\"); and some advanced Unix commands.";
	query("INSERT INTO course VALUES(" +
		"'Introduction to UNIX', '" + desc + "', 101, 'CPSC')");

	desc = "Unix signals, processes, and file system; interprocess communication; advanced shell programming; program profiling.";
	query("INSERT INTO course VALUES(" +
		"'Advanced UNIX', '" + desc + "', 102, 'CPSC')");

	desc = "Introduction to computer fundamentals; contemporary topics, such as security and privacy, and the Internet and World Wide Web. Problem solving, analysis and design using application software, including spreadsheets and databases.";
	query("INSERT INTO course VALUES(" +
		"'Introduction to Problem Solving using Application Software', '" + desc + "', 203, 'CPSC')");

	desc = "Introduction to problem solving, the analysis and design of small-scale computational systems, and implementation using a procedural programming language. For computer science majors.";
	query("INSERT INTO course VALUES(" +
		"'Introduction to Computer Science for Computer Science Majors I', '" + desc + "', 231, 'CPSC')");

	desc = "Continuation of Introduction to Computer Science for Computer Science Majors I. Emphasis on object-oriented analysis and design of small-scale computational systems and implementation using an object oriented language. Issues of design, modularization, and programming style will be emphasized.";
	query("INSERT INTO course VALUES(" +
		"'Introduction to Computer Science for Computer Science Majors II', '" + desc + "', 233, 'CPSC')");

	desc = "Fundamental data structures, including arrays, lists, stacks, queues, trees, hash tables, and graphs. Algorithms for searching and sorting. Introduction to the correctness and analysis of algorithms. For computer science majors and those interested in algorithm design and analysis, information security, and other mathematically-intensive areas.";
	query("INSERT INTO course VALUES(" +
		"'Data Structures, Algorithms, and Their Analysis', '" + desc + "', 331, 'CPSC')");

	desc = "A themed approach to representative works of poetry, prose, and/or drama. Emphasizes fundamental skills: how to read a text accurately and critically; how to write logically, clearly, and persuasively.";
	query("INSERT INTO course VALUES(" +
		"'Approaches to Literature', '" + desc + "', 201, 'ENGL')");

	desc = "An intensive introduction to the field of English emphasizing critical reading and writing as well as discussion. Expectations for writing and research will be higher than in other junior English courses.";
	query("INSERT INTO course VALUES(" +
		"'Introductory Seminar', '" + desc + "', 203, 'ENGL')");

	desc = "An examination of the claims and assumptions of a range of contemporary critical practices, such as formalism, structuralism, deconstruction, feminism and gender studies, new historicism, psychoanalytic criticism, and cultural and ideological critique. Includes sustained engagement with original theoretical texts.";
	query("INSERT INTO course VALUES(" +
		"'Introduction to Contemporary Theory', '" + desc + "', 302, 'ENGL')");

	query("INSERT INTO degree VALUES(" +
		"'BSC in Computer Science', 'CPSC')");

	query("INSERT INTO degree_require VALUES(" +
		"'BSC in Computer Science', 101, 'CPSC', 4.0)");

	query("INSERT INTO degree_require VALUES(" +
		"'BSC in Computer Science', 102, 'CPSC', 4.0)");

	query("INSERT INTO teaching_assistant VALUES(" +
		"'Syed Zain Raza Rizvi')");

	query("INSERT INTO course_section VALUES(" +
		"'LAB', 1234, 1, 'mon,9:00AM,11:50AM.tue,9:00AM,11:50AM.wen,9:00AM,11:50AM.thur,9:00AM,11:50AM', 'ST 135', 70349, 'Syed Zain Raza Rizvi', NULL, 101, 'CPSC')");

	query("INSERT INTO course_section VALUES(" +
		"'LAB', 1234, 1, 'tue,4:00PM,4:50PM.thur,4:00PM,4:50PM', 'ST 139', 70350, 'Syed Zain Raza Rizvi', NULL, 102, 'CPSC')");

	query("INSERT INTO schedule VALUES(" +
		"'109156be-c4fb-41ea-b1b4-efe1671c5836', 'My Schedule', 'testing 1, 2, 3...', 'blakemealey@gmail.com')");

	query("INSERT INTO schedule_section VALUES(" +
		"'109156be-c4fb-41ea-b1b4-efe1671c5836', '70349')");

	query("INSERT INTO schedule_section VALUES(" +
		"'109156be-c4fb-41ea-b1b4-efe1671c5836', '70350')");

	query("INSERT INTO user_degree VALUES(" +
		"'blakemealey@gmail.com', 'BSC in Computer Science')");
});

