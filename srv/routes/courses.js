var express = require('express');
var router = express.Router();

/* GET search page. */
// TODO: Refine regex to only accept URLs of the form: / [ Faculty [ /Department [ /Level | /Course ] ] ]
router.get(/\/.*/, function(req, res, next) {
	res.render('courses', { title: 'Dauwtrappen Course Search' });
});

module.exports = router;
