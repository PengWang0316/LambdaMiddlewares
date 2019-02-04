import cloudwatch from '@kevinwang0316/cloudwatch';
import { initialConnects } from '@kevinwang0316/mongodb-helper';

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
