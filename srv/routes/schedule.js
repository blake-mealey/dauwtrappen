var express = require('express');
var router = express.Router();

/* GET login page. */
router.get('/', function(req, res, next) {
	res.render('schedule', { title: 'Dauwtrappen Schedule Builder' });
});

module.exports = router;
