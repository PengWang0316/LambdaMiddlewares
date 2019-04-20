import sanitize from 'mongo-sanitize';
import { initialConnects } from '@kevinwang0316/mongodb-helper';

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
