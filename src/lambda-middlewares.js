import cloudwatch from '@kevinwang0316/cloudwatch';
import log from '@kevinwang0316/log';

// The middleware to flush the metrics to the CloudWatch
export const flushMetrics = {
  after: (handler, next) => cloudwatch.flush().then(() => next()),
  onError: (handler, next) => cloudwatch.flush().then(() => next(handler.error)),
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
