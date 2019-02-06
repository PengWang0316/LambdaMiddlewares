import sanitize from 'mongo-sanitize';

import {
  verifyUser, mongoSanitize, sampleLogging, initializeMongodb, flushMetrics,
} from '../src/lambda-middlewares';

jest.mock('mongo-sanitize', () => jest.fn());

describe('lambda-middlewares mongoSanitize', () => {
  test('sanitize without queryStringParameters and body', () => {
    const handler = {
      event: {},
    };
    const next = jest.fn();

    mongoSanitize.before(handler, next);

    expect(sanitize).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('sanitize with queryStringParameters and body', () => {
    const handler = {
      event: {
        queryStringParameters: {
          queryKey: 'queryKey',
        },
        body: {
          bodyKey: 'bodyKey',
        },
      },
    };
    const next = jest.fn();

    mongoSanitize.before(handler, next);

    expect(sanitize).toHaveBeenCalledTimes(2);
    expect(sanitize).toHaveBeenNthCalledWith(1, 'queryKey');
    expect(sanitize).toHaveBeenNthCalledWith(2, 'bodyKey');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
