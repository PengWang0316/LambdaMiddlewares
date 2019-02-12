# MongoDB Helper

Several middlewares for Lambda functions. 

[![Build Status](https://travis-ci.org/PengWang0316/LambdaMiddlewares.svg?branch=master)](https://travis-ci.org/PengWang0316/LambdaMiddlewares)
[![Coverage Status](https://coveralls.io/repos/github/PengWang0316/LambdaMiddlewares/badge.svg?branch=master)](https://coveralls.io/github/PengWang0316/LambdaMiddlewares?branch=master)

# Dependencies requirement

This library is working with several other packages.
The peer dependencies list:
- @kevinwang0316/cloudwatch (if use flushMetrics)
- aws-sdk (if use flushMetrics)
- aws-xray-sdk (if use flushMetrics)
- @kevinwang0316/jwt-verify (if use verifyJWT)
- @kevinwang0316/log (if use sampleLogging or verifyJWT)
- @kevinwang0316/mongodb-helper (if use initializeMongoDB)
- mongodb (if use initializeMongoDB)
- mongo-sanitize (if use mongoSanitize)

Please check your package.json file to make sure you have these packages or install them.

# Installing

```
npm install --save @kevinwang0316/lambda-middlewares
```

# Usage

```javascript
const middy = require('middy');
// Import the middlewares you want to use
const { flushMetrics, initializeMongoDB, mongoSanitize, sampleLogging, verifyJWT } = require('@kevinwang0316/lambda-middlewares');
// Here is your Lambda handler
const lambdaHandler = (event, context, callback) => {};

// You also can make a wrapper to add most common use
module.exports = middy(lambdaHandler)
  .use(sampleLogging())
  .use(mongoSanitize)
  .use(initializeMongodb)
  .use(verifyUser)
  .use(flushMetrics)
  .use(sampleLogging);
```

# License

Log is licensed under MIT License - see the [License file](https://github.com/PengWang0316/MongoDBHelper/blob/master/LambdaMiddlewares).
