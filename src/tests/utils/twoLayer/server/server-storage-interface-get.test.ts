import fs from 'fs';
import { ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheResult, StringValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ServerStorage Interface - Get Operation', () => {
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

    logStream = createLogStream('server-storage-interface-get-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should retrieve data from storage', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate: new Date(Date.now() + 1000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    const result = await serverStorage.get(testId, testStore);

    expect(result).toEqual(mockResult);
    expect(serverStorage.get).toHaveBeenCalledWith(testId, testStore);
    log('Data retrieved from storage successfully');
  });

  it('should return undefined for non-existent data', async () => {
    const testId = 'nonExistentId';
    const testStore = 'testStore';

    (serverStorage.get as jest.Mock).mockResolvedValue(undefined);

    const result = await serverStorage.get(testId, testStore);

    expect(result).toBeUndefined();
    expect(serverStorage.get).toHaveBeenCalledWith(testId, testStore);
    log('Undefined returned for non-existent data');
  });

  it('should handle errors during get operation', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const errorMessage = 'Failed to retrieve data';

    (serverStorage.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(serverStorage.get(testId, testStore)).rejects.toThrow(errorMessage);
    log('Error during get operation handled correctly');
  });

  it('should retrieve data from different stores', async () => {
    const testId = 'testId';
    const store1 = 'store1';
    const store2 = 'store2';
    const testData1: StringValue = { type: 'string', value: 'testValue1' };
    const testData2: StringValue = { type: 'string', value: 'testValue2' };

    const mockResult1: CacheResult = {
      identifier: testId,
      storeName: store1,
      value: testData1,
      expirationDate: new Date(Date.now() + 1000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    const mockResult2: CacheResult = {
      identifier: testId,
      storeName: store2,
      value: testData2,
      expirationDate: new Date(Date.now() + 1000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock)
      .mockResolvedValueOnce(mockResult1)
      .mockResolvedValueOnce(mockResult2);

    const result1 = await serverStorage.get(testId, store1);
    const result2 = await serverStorage.get(testId, store2);

    expect(result1).toEqual(mockResult1);
    expect(result2).toEqual(mockResult2);
    expect(serverStorage.get).toHaveBeenCalledWith(testId, store1);
    expect(serverStorage.get).toHaveBeenCalledWith(testId, store2);
    log('Data retrieved from different stores successfully');
  });

  it('should handle expired data', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate: new Date(Date.now() - 1000), // Expired
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    const result = await serverStorage.get(testId, testStore);

    expect(result).toEqual(mockResult);
    // Note: In a real implementation, you might want to handle expired data differently
    // This test assumes the raw data is returned and expiration is handled at a higher level
    log('Expired data handled');
  });
});
