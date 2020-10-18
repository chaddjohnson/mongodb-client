const mongoose = require('mongoose'); // eslint-disable-line import/no-unresolved

class Client {
  constructor(uri, options = {}) {
    if (!uri || typeof uri !== 'string') {
      throw new Error('Invalid URI');
    }

    this.uri = uri;
    this.connection = null;

    this.options = {
      // Reference: https://mongoosejs.com/docs/lambda.html
      // Buffering means mongoose will queue up operations if it gets
      // disconnected from MongoDB and send them when it reconnects.
      // With serverless, better to fail fast if not connected.
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // and MongoDB driver buffering

      ...options
    };

    // Add options specific to Mongoose 4.
    if (mongoose.version.match(/^4\./)) {
      this.options = {
        ...this.options,
        useMongoClient: true
      };
    }

    // Add options specific to Mongoose 5.
    if (mongoose.version.match(/^5\./)) {
      this.options = {
        ...this.options,
        useNewUrlParser: true,
        useCreateIndex: true
      };
    }
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
