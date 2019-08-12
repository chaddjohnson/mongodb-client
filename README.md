# Mongoose Client Wrapper

Optimized for use with Lambda, but still compatible with non-Lambda environments.

This library takes care of the following:

1. Allow connections to multiple MongoDB databases (rather than assuming only one via `mongoose.connection`).
1. Use a factory to ensure connections are reused.
1. Provide model loaders compatible with environments that either use or do not use command buffering (`bufferCommands`).
1. Set optimal connection default settings geared toward Lambda (but allow overrides for non-Lambda environments).
1. Provide convenience method checking if the client is connected.
1. Provide all of this in a neat, clean, easy to use interface.

## Installation

1. Add to your app: `yarn install @chaddjohnson/mongodb-client-lambda`
1. Install Mongoose in your app: `yarn install mongoose`.
1. Run your app: `node app.js`. If using `yarn link` or `npm link`, use `node --preserve-symlinks` since this library uses `peerDependencies` for mongoose.

## Use in Lambda environment

Define a model loader (`models/index.js`):

```javascript
const path = require('path');
const { loadModel } = require('@chaddjohnson/mongodb-client-lambda').loader;

const connectionUri = 'mongodb://localhost:27017/example-db';

// No need to establish database connection here as it will be estalished when `loadModel()` is called the first time.

// Define paths to models for the loader.
const pathsMap = {
  User: path.join(__dirname, './user'),
  Order: path.join(__dirname, './order'),
  Product: path.join(__dirname, './product')
};

// Use an async method for loading models as models must be loaded after the database
// connection is established since command buffering is disabled for Lambda environments.
module.exports.get = async (name) => loadModel(name, pathsMap, connectionUri);
```

Then define your Lambda handler:

```javascript
// Use model loader.
const models = require('./models');

module.exports.handler = async (event, context) => {
  // See https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const Product = await models.get('Product');
    const products = product.find({});

    return {
      statusCode: 200,
      body: products.toJSON()
    };
  }
  catch (error) {
    console.log(error.stack);

    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};
```

For this to work, your Lambda functions will need access to your database server. Some options to make this possible are:

1. VPC Peering. See the following articles:

    * [A basic guide to connecting a AWS Lambda function to MongoDB in EC2 via VPC Peering](https://medium.com/@kavitanambissan/a-basic-guide-to-connecting-a-aws-lambda-function-to-mongodb-in-ec2-via-vpc-peering-7a644e8c5f35)
    * [What is VPC Peering?](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html)

1. Change firewall settings for your server to allow connections from anywhere. Be sure to use SSL.

## Use in non-Lambda environment

Define a model loader (`models/index.js`):

```javascript
const path = require('path');
const { loadModels } = require('@chaddjohnson/mongodb-client-lambda').loader;

// Define paths to models for the loader.
const pathsMap = {
  User: path.join(__dirname, './user'),
  Order: path.join(__dirname, './order'),
  Product: path.join(__dirname, './product')
};

// Provide loaded models by default for legacy support.
module.exports = loadModels(pathsMap);
```

App bootstrapper:

```javascript
const mongodbClientFactory = require('@chaddjohnson/mongodb-client-lambda').factory;

// Enable command buffering as it is disabled by default with this package.
const connectionOptions = {
  bufferCommands: true,
  bufferMaxEntries: -1
};
const connectionUri = 'mongodb://localhost:27017/example-db';
const mongodbClient = mongodbClientFactory.get(connectionUri, connectionOptions);

// Explicitly begin establishing the connection prior to loading data models.
mongodbClient.connect();

// Load models AFTER beginning connection establishment.
require('./models');
```

App:

```javascript
const express = require('express');
const app = express();

app.get('/products', (request, response) => {
  try {
    const Product = require('./models/product');
    const products = product.find({});

    response.status(200).json(products);
  }
  catch (error) {
    response.status(500).end();
  }
};
```

Notice this example does not use `model.get()` for async model loading. This is because command buffering is re-enabled. You can also use async model loading in non-Lambda environments:

```javascript
const express = require('express');
const models = require('./models');
const app = express();

app.get('/products', (request, response) => {
  try {
    // Load model asynchronously.
    const Product = await models.get('Product');
    const products = product.find({});

    response.status(200).json(products);
  }
  catch (error) {
    response.status(500).end();
  }
};
```

For this you will need to provide a `.get()` method in our model loader as shown earlier:

```javascript
module.exports.get = async (name) => loadModel(name, pathsMap, connectionUri);
```
