process.env.jwtName = 'jwtMessage';

const sanitize = require('mongo-sanitize');
const verify = require('@kevinwang0316/jwt-verify');
const { info } = require('@kevinwang0316/log');

const {
  verifyJWT, mongoSanitize, sampleLogging, initializeMongodb, flushMetrics,
} = require('../src/lambda-middlewares');


jest.mock('mongo-sanitize', () => jest.fn());
jest.mock('@kevinwang0316/jwt-verify', () => jest.fn().mockReturnValue(false));
jest.mock('@kevinwang0316/log', () => ({ info: jest.fn() }));

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
