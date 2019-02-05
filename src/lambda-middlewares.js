import cloudwatch from '@kevinwang0316/cloudwatch';
import { initialConnects } from '@kevinwang0316/mongodb-helper';
import sanitize from 'mongo-sanitize';
import log from '@kevinwang0316/log';

// The middleware to flush the metrics to the CloudWatch
export const flushMetrics = {
  after: (handler, next) => cloudwatch.flush().then(() => next()),
  onError: (handler, next) => cloudwatch.flush().then(() => next(handler.error)),
};

export const initializeMongoDB = {
  before: (handler, next) => {
    initialConnects(handler.context.dbUrl, handler.context.dbName).then(() => next());
  },
};

// Sanitize the user input parameters or body
export const mongoSanitize = {
  before: (handler, next) => {
    const { queryStringParameters, body } = handler.event;
    if (queryStringParameters) { // If the event has queryStringParameters, sanitzie all of the element
      const newParameters = {};
      Object.keys(queryStringParameters).forEach(key => { newParameters[key] = sanitize(queryStringParameters[key]); });
      handler.queryStringParameters = newParameters;
    }
    if (body) {
      const newBody = {};
      Object.keys(body).forEach(key => { newBody[key] = sanitize(body[key]); });
      handler.body = newBody;
    }
    next();
  },
};

export const sampleLogging = (option = { sampleRate: 0.01 }) => { // The defualt sample rate is 1%
  let logLevel;
  const { sampleRate } = option;

  // const isDebugEnabled = () => {
  //   return correlationIds.get()['Debug-Log-Enabled'] === 'true' ? true : Math.random() <= sampleRate;
  // };

  return {
    before: (handler, next) => {
      if (process.env.log_level !== 'DEBUG' && Math.random() <= sampleRate) {
        logLevel = process.env.log_level;
        process.env.log_level = 'DEBUG';
      }
      next();
    },
    after: (handler, next) => {
      if (logLevel) process.env.log_level = logLevel;
      next();
    },
    onError: (handler, next) => { // Handle the error.
      const { awsRequestId } = handler.context;
      const invocationEvent = JSON.stringify(handler.event);
      log.error('Invocation failed', { awsRequestId, invocationEvent }, handler.error);
      next(handler.error);
    },
  };
};
