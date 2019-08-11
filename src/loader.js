const factory = require('./factory');

let modelsLoaded = false;
let modelMap = {};

const loadModels = (modelPathsMap) => {
  if (modelsLoaded) {
    return modelMap;
  }

  const modelNames = Object.keys(modelPathsMap);

  // Build a map of models indexed by model name.
  modelMap = modelNames.reduce((map, modelName) => {
    return {
      ...map,
      [modelName]: require(modelPathsMap[modelName])  // eslint-disable-line import/no-dynamic-require
    };
  }, {})

  modelsLoaded = true;

  return modelMap;
};

const loadModel = async (modelName, modelPathsMap, connectionUri, connectionOptions = {}) => {
  const client = factory.get(connectionUri, connectionOptions);

  if (client.connected && modelMap[modelName]) {
    return modelMap[modelName];
  }

  // If the bufferCommands connection option is false, the connection must be established prior to models being loaded.
  await client.connect();

  loadModels(modelPathsMap);

  return modelMap[modelName];
};

module.exports.loadModel = loadModel;
module.exports.loadModels = loadModels;
