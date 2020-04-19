const constants = require('./constants')
let getPageAndLimit = function (request) {
  let page = request.query.page;
  let limit = request.query.limit;

  return {
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit): constants.MAX_NUMBER_RETURNED_RESULTS
  }
}

module.exports = {
  getPageAndLimit: getPageAndLimit
}
