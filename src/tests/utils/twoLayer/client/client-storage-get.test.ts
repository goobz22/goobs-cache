import fs from 'fs';
import { ClientStorage } from '../../../../utils/twoLayerCache.client';
import { CacheResult, StringValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ClientStorage - get', () => {
  let clientStorage: ClientStorage;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    clientStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    };

    logStream = createLogStream('client-storage-get-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  const getAsync = (identifier: string, storeName: string): Promise<CacheResult | undefined> => {
    return new Promise((resolve) => {
      clientStorage.get(identifier, storeName, (result) => {
        resolve(result);
      });
    });
  };

  it('should retrieve data from client storage', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();
    const expectedResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate: expirationDate,
      lastUpdatedDate: expirationDate,
      lastAccessedDate: expirationDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    clientStorage.get = jest.fn(
      (id: string, store: string, callback: (result: CacheResult | undefined) => void) => {
        callback(expectedResult);
      },
    );

    const result = await getAsync('testId', 'testStore');

    expect(result).toEqual(expectedResult);
    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    log('Data retrieved from client storage');
  });

  it('should return undefined when data is not found', async () => {
    clientStorage.get = jest.fn(
      (id: string, store: string, callback: (result: CacheResult | undefined) => void) => {
        callback(undefined);
      },
    );

    const result = await getAsync('testId', 'testStore');

    expect(result).toBeUndefined();
    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    log('Undefined returned when data is not found');
  });

  it('should handle errors during get operation', async () => {
    const testError = new Error('Test error');
    clientStorage.get = jest.fn(
      (id: string, store: string, callback: (result: CacheResult | undefined) => void) => {
        callback(testError as unknown as undefined);
      },
    );

    const result = await getAsync('testId', 'testStore');

    expect(result).toBeUndefined();
    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    log('Error handled during get operation');
  });

  it('should return expired data', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expiredDate = new Date(Date.now() - 1000); // 1 second in the past
    const expectedResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate: expiredDate,
      lastUpdatedDate: expiredDate,
      lastAccessedDate: expiredDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    clientStorage.get = jest.fn(
      (id: string, store: string, callback: (result: CacheResult | undefined) => void) => {
        callback(expectedResult);
      },
    );

    const result = await getAsync('testId', 'testStore');

    expect(result).toEqual(expectedResult);
    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    log('Expired data returned from client storage');
  });
});
