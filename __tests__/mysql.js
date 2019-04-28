import { initialMysqlPool } from '../src/mysql';

jest.mock('@kevinwang0316/mysql-helper', () => ({}));

describe('initializeMysqlPool', () => {
  test('before', () => {
    const mongodbHelper = require('@kevinwang0316/mysql-helper');
    const mockInitialConnects = jest.fn();
    mongodbHelper.initialPool = mockInitialConnects;
    const mockNext = jest.fn();
    const handler = {
      context: {
        dbHost: 'host', dbUser: 'user', dbPassword: 'pw', dbName: 'databaseName',
      },
    };

    initialMysqlPool.before(handler, mockNext);

    expect(mockInitialConnects).toHaveBeenCalledTimes(1);
    expect(mockInitialConnects)
      .toHaveBeenLastCalledWith(
        handler.context.dbHost,
        handler.context.dbUser,
        handler.context.dbPassword,
        handler.context.dbName,
        1,
        { multipleStatements: true },
      );
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
