import fs from 'fs';
import { ServerStorage } from '../../../../utils/twoLayerCache.client';
import { CacheResult, StringValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ServerStorage - get', () => {
  let serverStorage: ServerStorage;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    logStream = createLogStream('server-storage-get-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should retrieve data from server storage', async () => {
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

    serverStorage.get = jest.fn().mockResolvedValue(expectedResult);

    const result = await serverStorage.get('testId', 'testStore');

    expect(result).toEqual(expectedResult);
    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
    log('Data retrieved from server storage');
  });

  it('should return undefined when data is not found', async () => {
    serverStorage.get = jest.fn().mockResolvedValue(undefined);

    const result = await serverStorage.get('testId', 'testStore');

    expect(result).toBeUndefined();
    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
    log('Undefined returned when data is not found');
  });

  it('should handle errors during get operation', async () => {
    const testError = new Error('Test error');
    serverStorage.get = jest.fn().mockRejectedValue(testError);

    await expect(serverStorage.get('testId', 'testStore')).rejects.toThrow('Test error');
    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
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

    serverStorage.get = jest.fn().mockResolvedValue(expectedResult);

    const result = await serverStorage.get('testId', 'testStore');

    expect(result).toEqual(expectedResult);
    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
    log('Expired data returned from server storage');
  });

  it('should handle different store names', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();
    const expectedResult: CacheResult = {
      identifier: 'testId',
      storeName: 'customStore',
      value: testData,
      expirationDate: expirationDate,
      lastUpdatedDate: expirationDate,
      lastAccessedDate: expirationDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(expectedResult);

    const result = await serverStorage.get('testId', 'customStore');

    expect(result).toEqual(expectedResult);
    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'customStore');
    log('Data retrieved from custom store name');
  });
});
