# Lambda Middlewares

Several middlewares for Lambda functions. 

[![Build Status](https://travis-ci.org/PengWang0316/LambdaMiddlewares.svg?branch=master)](https://travis-ci.org/PengWang0316/LambdaMiddlewares)
[![Coverage Status](https://coveralls.io/repos/github/PengWang0316/LambdaMiddlewares/badge.svg?branch=master)](https://coveralls.io/github/PengWang0316/LambdaMiddlewares?branch=master)

# Dependencies requirement

This library is working with several other packages.
The peer dependencies list:
- #### If use flushMetrics
  - @kevinwang0316/cloudwatch
  - aws-sdk
  - aws-xray-sdk
- #### If use verifyJWT
  - @kevinwang0316/jwt-verify
  - @kevinwang0316/log
- #### If use sampleLogging
  - @kevinwang0316/log
- #### If use initializeMongoDB
  - @kevinwang0316/mongodb-helper
  - mongodb
- #### If use mongoSanitize
  - mongo-sanitize
- #### If use initialMysqlPool
  - mysql
  - @kevinwang0316/mysql-helper

Please check your package.json file to make sure you have these packages or install them.

# Installing

```
npm install --save @kevinwang0316/lambda-middlewares
```

# Usage

```javascript
const middy = require('middy');
// Import the middlewares you want from different files
const { verifyJWT } = require('@kevinwang0316/lambda-middlewares/jwt');
const { initialMysqlPool } = require('@kevinwang0316/lambda-middlewares/mysql');
const { flushMetrics, sampleLogging, verifyJWT } = require('@kevinwang0316/lambda-middlewares');
const { initializeMongoDB, mongoSanitize } = require('@kevinwang0316/lambda-middlewares/mongodb');
// Here is your Lambda handler
const lambdaHandler = (event, context, callback) => {};

// You also can make a wrapper to add most common use
module.exports = middy(lambdaHandler)
  .use(sampleLogging())
  .use(mongoSanitize)
  .use(initializeMongodb)
  .use(verifyUser)
  .use(flushMetrics)
  .use(sampleLogging)
  .use(initialMysqlPool);
```

# License

LambdaMiddlewares is licensed under MIT License - see the [License file](https://github.com/PengWang0316/MongoDBHelper/blob/master/LambdaMiddlewares).
