process.env.jwtName = 'jwtMessage';

const sinon = require('sinon');
const sanitize = require('mongo-sanitize');
const verify = require('@kevinwang0316/jwt-verify');
const { info, error } = require('@kevinwang0316/log');
// const cloudwatch = require('@kevinwang0316/cloudwatch');
// const { initialConnects } = require('@kevinwang0316/mongodb-helper');

const {
  verifyJWT, mongoSanitize, sampleLogging, initializeMongoDB, flushMetrics,
} = require('../src/lambda-middlewares');


jest.mock('mongo-sanitize', () => jest.fn());
jest.mock('@kevinwang0316/jwt-verify', () => jest.fn().mockReturnValue(false));
jest.mock('@kevinwang0316/log', () => ({ info: jest.fn(), error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({}));
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

describe('verity-user middleware', () => {
  beforeEach(() => {
    info.mockClear();
    verify.mockClear();
  });

  afterAll(() => {
    info.mockClear();
    verify.mockClear();
  });

  test('No event.queryStringParameters and body', () => {
    const mockNext = jest.fn();
    const mockCallback = jest.fn();

    verifyJWT.before({
      event: {},
      context: { functionName: 'functionName' },
      callback: mockCallback,
    }, mockNext);

    expect(verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call functionName');
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });

  test('Has event.queryStringParameters but not jwtName', () => {
    const mockNext = jest.fn();
    const mockCallback = jest.fn();

    verifyJWT.before({
      event: { queryStringParameters: {} },
      context: { functionName: 'functionName' },
      callback: mockCallback,
    }, mockNext);

    expect(verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call functionName');
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });

  test('verify failed', () => {
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const context = { functionName: 'functionName', jwtSecret: 'jwtSecret' };

    verifyJWT.before({
      event: { queryStringParameters: { [process.env.jwtName]: 'jwtMessage' } },
      context,
      callback: mockCallback,
    }, mockNext);

    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenLastCalledWith('jwtMessage', 'jwtSecret');
    expect(mockNext).not.toHaveBeenCalled();
    expect(context.user).toBeUndefined();
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call functionName');
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });

  test('verify passed without role', () => {
    verify.mockReturnValueOnce({ _id: 'id' });
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const context = { functionName: 'functionName', jwtSecret: 'jwtSecret' };

    verifyJWT.before({
      event: { queryStringParameters: { [process.env.jwtName]: 'jwtMessage' } },
      context,
      callback: mockCallback,
    }, mockNext);

    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenLastCalledWith('jwtMessage', 'jwtSecret');
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(context.user).toEqual({ _id: 'id', role: 3 });
    expect(info).not.toHaveBeenCalled();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('verify passed with role', () => {
    verify.mockReturnValueOnce({ _id: 'id', role: '1' });
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const context = { functionName: 'functionName', jwtSecret: 'jwtSecret' };

    verifyJWT.before({
      event: { queryStringParameters: { [process.env.jwtName]: 'jwtMessage' } },
      context,
      callback: mockCallback,
    }, mockNext);

    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenLastCalledWith('jwtMessage', 'jwtSecret');
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(context.user).toEqual({ _id: 'id', role: '1' });
    expect(info).not.toHaveBeenCalled();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('has body verify passed with role', () => {
    verify.mockReturnValueOnce({ _id: 'id', role: '1' });
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const context = { functionName: 'functionName', jwtSecret: 'jwtSecret' };

    verifyJWT.before({
      event: { body: `{ "${process.env.jwtName}": "jwtMessage" }` },
      context,
      callback: mockCallback,
    }, mockNext);

    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenLastCalledWith('jwtMessage', 'jwtSecret');
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(context.user).toEqual({ _id: 'id', role: '1' });
    expect(info).not.toHaveBeenCalled();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('has body verify without jwt message', () => {
    verify.mockReturnValueOnce({ _id: 'id', role: '1' });
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const context = { functionName: 'functionName', jwtSecret: 'jwtSecret' };

    verifyJWT.before({
      event: { body: '{}' },
      context,
      callback: mockCallback,
    }, mockNext);

    expect(verify).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenLastCalledWith('Invalid user tried to call functionName');
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith(null, { body: 'Invalid User' });
  });
});

describe('flushMetrics', () => {
  test('after', () => {
    const cloudwatchLib = require('@kevinwang0316/cloudwatch');
    const mockNext = jest.fn();
    const mockThen = jest.fn().mockImplementation(cb => cb());
    const mockFlush = jest.fn().mockReturnValue({ then: mockThen });
    cloudwatchLib.flush = mockFlush;

    flushMetrics.after(null, mockNext);

    expect(mockFlush).toHaveBeenCalledTimes(1);
    expect(mockThen).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  test('onError', () => {
    const cloudwatchLib = require('@kevinwang0316/cloudwatch');
    const handler = { error: 'error message' };
    const mockNext = jest.fn();
    const mockThen = jest.fn().mockImplementation(cb => cb());
    const mockFlush = jest.fn().mockReturnValue({ then: mockThen });
    cloudwatchLib.flush = mockFlush;

    flushMetrics.onError(handler, mockNext);

    expect(mockFlush).toHaveBeenCalledTimes(1);
    expect(mockThen).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenLastCalledWith(handler.error);
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

describe('sampleLogging', () => {
  beforeEach(() => {
    error.mockClear();
  });

  afterAll(() => {
    error.mockClear();
  });

  test('before and after default sampleRate and random less than rate', () => {
    process.env.log_level = 'ERROR';
    const mockNext = jest.fn();
    const stub = sinon.stub(Math, 'random').returns(0);

    const middleware = sampleLogging();
    middleware.before(null, mockNext);

    expect(process.env.log_level).toBe('DEBUG');
    expect(mockNext).toHaveBeenCalledTimes(1);

    middleware.after(null, mockNext);

    expect(process.env.log_level).toBe('ERROR');
    expect(mockNext).toHaveBeenCalledTimes(2);

    stub.restore();
  });

  test('before customized sampleRate and random greater than rate', () => {
    process.env.log_level = 'ERROR';
    const mockNext = jest.fn();
    const stub = sinon.stub(Math, 'random').returns(0.5);

    const middleware = sampleLogging({ sampleRate: 0.3 });
    middleware.before(null, mockNext);

    expect(process.env.log_level).toBe('ERROR');
    expect(mockNext).toHaveBeenCalledTimes(1);

    middleware.after(null, mockNext);

    expect(process.env.log_level).toBe('ERROR');
    expect(mockNext).toHaveBeenCalledTimes(2);

    stub.restore();
  });

  test('onError', () => {
    const handler = {
      context: { awsRequestId: 'request id' },
      event: { invocationEvent: 'something' },
      error: 'error message',
    };
    const mockNext = jest.fn();

    sampleLogging().onError(handler, mockNext);

    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenLastCalledWith('Invocation failed', { awsRequestId: handler.context.awsRequestId, invocationEvent: JSON.stringify(handler.event) }, handler.error);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenLastCalledWith(handler.error);
  });
});
