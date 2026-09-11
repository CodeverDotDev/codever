const express = require('express');
const router = express.Router();
const revision = require('child_process');

router.get('/', function (req, res) {
  let gitSha1;
  try {
    // works in dev (repo checkout with git); in the Docker image there is no
    // git/.git — fall back to the GIT_SHA1 build arg/env var (set by CI) or 'unknown'
    gitSha1 = revision.execSync('git rev-parse HEAD', {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim();
  } catch (e) {
    gitSha1 = process.env.GIT_SHA1 || 'unknown';
  }
  const pjson = require('../../../package.json');
  let response = {
    version: pjson.version,
    gitSha1: gitSha1,
  };
  res.json(response);
});

module.exports = router;
