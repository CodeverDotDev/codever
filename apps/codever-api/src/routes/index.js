var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
  res.send(
    'API Backend supporting Codever.dev - <a href="/api/docs">Swagger Docs</a>'
  );
});

module.exports = router;
