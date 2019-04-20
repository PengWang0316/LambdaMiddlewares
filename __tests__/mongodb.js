import sanitize from 'mongo-sanitize';

import { mongoSanitize, initializeMongoDB } from '../src/mongodb';

jest.mock('mongo-sanitize', () => jest.fn());
jest.mock('@kevinwang0316/mongodb-helper', () => ({}));

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

describe('initializeMongoDB', () => {
  test('before', () => {
    const mongodbHelper = require('@kevinwang0316/mongodb-helper');
    const mockThen = jest.fn().mockImplementation(cb => cb());
    const mockInitialConnects = jest.fn().mockReturnValue({ then: mockThen });
    mongodbHelper.initialConnects = mockInitialConnects;
    const mockNext = jest.fn();
    const handler = { context: { dbUrl: 'url', dbName: 'name' } };

    initializeMongoDB.before(handler, mockNext);

    expect(mockInitialConnects).toHaveBeenCalledTimes(1);
    expect(mockInitialConnects)
      .toHaveBeenLastCalledWith(handler.context.dbUrl, handler.context.dbName);
    expect(mockThen).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
