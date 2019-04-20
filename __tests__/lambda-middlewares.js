const sinon = require('sinon');
const { error } = require('@kevinwang0316/log');
// const cloudwatch = require('@kevinwang0316/cloudwatch');
// const { initialConnects } = require('@kevinwang0316/mongodb-helper');

const { sampleLogging, flushMetrics } = require('../src/lambda-middlewares');

jest.mock('@kevinwang0316/log', () => ({ info: jest.fn(), error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({}));

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
