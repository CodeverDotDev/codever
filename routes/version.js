const express = require('express');
const router = express.Router();
const revision = require('child_process')

const common = require('../common/config');
const config = common.config();

const constants = require('../common/constants')

/* GET title of bookmark given its url */
router.get('/', function(req, res) {
  if(config.environment === constants.ENV.DEV){
    const gitSha1 = revision.execSync('git rev-parse HEAD')
      .toString()
      .trim();
    const pjson = require('../package.json')
    let response = {
      version: pjson.version,
      gitSha1: gitSha1
    }
    res.json(response);
  } else {
    res.json(null);
  }
});

module.exports = router;
  
