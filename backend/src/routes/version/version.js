const express = require('express');
const router = express.Router();
const revision = require('child_process');

router.get('/', function (req, res) {
  const gitSha1 = revision.execSync('git rev-parse HEAD').toString().trim();
  const pjson = require('../../../package.json');
  let response = {
    version: pjson.version,
    gitSha1: gitSha1,
  };
  res.json(response);
});

module.exports = router;
