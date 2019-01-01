var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('API Backend supporting Codingmarks.org - <a href="/api/docs">Swagger Docs</a>');
});

module.exports = router;
