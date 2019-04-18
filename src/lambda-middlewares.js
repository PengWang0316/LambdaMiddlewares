import sanitize from 'mongo-sanitize';
import cloudwatch from '@kevinwang0316/cloudwatch';
import verify from '@kevinwang0316/jwt-verify';
import { initialConnects } from '@kevinwang0316/mongodb-helper';
import { initialPool } from '@kevinwang0316/mysql-helper';
import log from '@kevinwang0316/log';

const { jwtName } = process.env;

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

export const initialMysqlPool = {
  before: (handler, next) => {
    const {
      dbHost, dbUser, dbPassword, dbName,
    } = handler.context;
    initialPool(dbHost, dbUser, dbPassword, dbName).then(() => next());
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

export const verifyJWT = {
  before: (handler, next) => {
    let jwtMessage;
    if (handler.event.queryStringParameters && handler.event.queryStringParameters[jwtName]) jwtMessage = handler.event.queryStringParameters[jwtName];
    else if (handler.event.body) {
      const message = JSON.parse(handler.event.body)[jwtName];
      if (message) jwtMessage = message;
    }
    const user = jwtMessage
      ? verify(jwtMessage, handler.context.jwtSecret)
      : false;
    if (user) {
      // Give a default role if the jwt is missing role information
      handler.context.user = user.role === undefined || user.role === null ? { ...user, role: 3 } : user;
      next();
    } else {
      log.info(`Invalid user tried to call ${handler.context.functionName}`);
      handler.callback(null, { body: 'Invalid User' });
    }
  },
};
