const Promise = require('bluebird');
const mongoose = require('mongoose');

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

    this.options = options;
    this.uri = uri;
    this.connection = null;
  }

  /**
   * Property getter for checking whether a connection is established.
   */
  get connected() {
    return !!this.connection && this.connection.readyState === 1;
  }

  async connect() {
    // Do nothing if already connected.
    if (this.connected) {
      return;
    }

    const defaultOptions = {
      reconnectTries: 30,
      reconnectInterval: 500,

      // The maximum number of sockets the MongoDB driver will keep open for this connection.
      poolSize: 5,

      // How long the MongoDB driver will wait before killing a socket due to inactivity after initial connection.
      socketTimeoutMS: 60 * 1000,

      // Keep the connection alive.
      keepAlive: true,

      // Reference: https://mongoosejs.com/docs/lambda.html
      // Buffering means mongoose will queue up operations if it gets
      // disconnected from MongoDB and send them when it reconnects.
      // With serverless, better to fail fast if not connected.
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // and MongoDB driver buffering
    };

    const options = {
      ...defaultOptions,
      ...this.options
    };

    this.connection = await mongoose.createConnection(this.uri, options);

    this.connection.on('error', () => {
      // Disconnect if connected.
      if (this.connection.readyState !== 0) {
        this.connection.close();
      }
    });
  }

  disconnect(callback) {
    // Don't try to disconnect if already disconnected.
    if (!this.connection || this.connection.readyState === 0) {
      return callback();
    }

    this.connection.close(callback);
  }
}

module.exports = Client;
