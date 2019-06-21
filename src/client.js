const Promise = require('bluebird');
const mongoose = require('mongoose');

const reconnectTimeout = 5 * 1000;  // 5 seconds

mongoose.Promise = Promise;

// Turn on usePushEach for all models.
mongoose.plugin(schema => {
  schema.options.usePushEach = true;
});

class Client {
  constructor(uri, options) {
    if (!uri || typeof uri !== 'string') {
      throw new Error('Invalid URI');
    }

    this.uri = uri;
    this.options = options || {};
    this.connection = null;

    // Connect immediately on instantiation.
    this.connect();
  }

  /*
   * Define a property getter for checking whether a connection
   * is established.
   */
  get connected() {
    return this.connection.readyState === 1;
  }

  connect() {
    const defaultOptions = {
      reconnectTries: Number.MAX_VALUE,
      useMongoClient: true,
      poolSize: 5,
      socketTimeoutMS: 60 * 1000,
      keepAlive: 30 * 1000,
    };
    const options = Object.assign({}, defaultOptions, this.options);

    this.connection = mongoose.createConnection(this.uri, options);

    this.connection.on('error', () => {
      // Disconnect if connected.
      if (this.connection.readyState !== 0) {
        this.connection.close();
      }

      setTimeout(() => {
        // Wait and then try to reconnect.
        this.connect();
      }, reconnectTimeout);
    });
  }

  disconnect(callback) {
    // Don't try to disconnect if already disconnected.
    if (this.connection.readyState === 0) {
      return callback();
    }

    this.connection.close(callback);
  }

  on(eventName, callback) {
    this.connection.on(eventName, callback);
  }

  once(eventName, callback) {
    this.connection.once(eventName, callback);
  }
}

module.exports = Client;
