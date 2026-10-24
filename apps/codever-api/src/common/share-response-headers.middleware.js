const noStore = (request, response, next) => {
  response.set('Cache-Control', 'no-store');
  next();
};

const noReferrer = (request, response, next) => {
  response.set('Referrer-Policy', 'no-referrer');
  next();
};

module.exports = { noReferrer, noStore };
