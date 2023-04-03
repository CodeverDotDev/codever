const NodeCache = require('node-cache');
const nodeCache = new NodeCache();

let cacheMiddleware = (minutes) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url;
    let cacheContent = nodeCache.get(key);
    if (cacheContent) {
      res.send(cacheContent);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        nodeCache.set(key, body, minutes * 60);
        res.sendResponse(body);
      };
      next();
    }
  };
};

module.exports = {
  cacheMiddleware: cacheMiddleware,
};
