import { initialPool } from '@kevinwang0316/mysql-helper';

export const initialMysqlPool = {
  before: (handler, next) => {
    const {
      dbHost, dbUser, dbPassword, dbName,
    } = handler.context;
    initialPool(dbHost, dbUser, dbPassword, dbName, 1, { multipleStatements: true });
    next();
  },
};

export default initialMysqlPool;
