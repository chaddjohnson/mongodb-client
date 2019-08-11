const Client = require('./client');

const cache = {};

const get = (connectionUri, options) => {
  const cacheKey = connectionUri;
  const client = cache[cacheKey] || new Client(connectionUri, options);

  cache[cacheKey] = client;

  return client;
};

module.exports.get = get;
