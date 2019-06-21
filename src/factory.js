const Client = require('./client');

class FactoryCacher {
  constructor() {
    /*
     * This is encapsulated inside a class rather than being global
     * to this module in order to avoid collisions.
     */
    this.cachedClients = {};
  }

  get(cacheKey, factoryFn) {
    // See if a client is cached.
    if (this.cachedClients[cacheKey]) {
      // Return the cached client.
      return this.cachedClients[cacheKey];
    }

    const client = factoryFn();

    // Cache the client.
    this.cachedClients[cacheKey] = client;

    return client;
  }
}

const factoryCache = new FactoryCacher();

const factory = (url, options) => {
  return function() {
    return new Client(url, options);
  };
};

const get = (url, options) => {
  const cacheKey = url;
  const factoryFn = factory(url, options);

  return factoryCache.get(cacheKey, factoryFn);
};

module.exports.get = get;
