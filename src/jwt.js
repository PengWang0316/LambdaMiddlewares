import verify from '@kevinwang0316/jwt-verify';
import log from '@kevinwang0316/log';

const { jwtName } = process.env;

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

export default verifyJWT;
