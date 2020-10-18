const Promise = require('bluebird');
const mongoose = require('mongoose'); // eslint-disable-line import/no-unresolved

// Use Bluebird promises.
mongoose.Promise = Promise;

// Set default schema options.
mongoose.plugin(schema => {
  // Turn on timestamps for all models.
  schema.options.timestamps = true;

  // Turn on usePushEach for all models.
  schema.options.usePushEach = true;
});

class Client {
  constructor(uri, options = {}) {
    if (!uri || typeof uri !== 'string') {
      throw new Error('Invalid URI');
    }

    this.uri = uri;
    this.connection = null;
    this.options = options;
  }

  /**
   * Property getter for checking whether a connection is established.
   */
  get connected() {
    return !!this.connection && this.connection.readyState === 1;
  }

  /**
   * Property getter for checking whether a connection is being established.
   */
  get connecting() {
    return !!this.connection && this.connection.readyState === 2;
  }

  connect() {
    // Do nothing if already connected or connecting.
    if (this.connected || this.connecting) {
      return this.connection;
    }

    this.connection = mongoose.createConnection(this.uri, this.options);

    this.connection.on('error', () => {
      // Disconnect if connected.
      if (this.connection.readyState !== 0) {
        this.connection.close();
      }
    });

    return this.connection;
  }

  disconnect(callback) {
    callback = callback || (() => {});

    // Don't try to disconnect if already disconnected.
    if (!this.connection || this.connection.readyState === 0) {
      return callback();
    }

    this.connection.close(callback);
  }
}

module.exports = Client;
