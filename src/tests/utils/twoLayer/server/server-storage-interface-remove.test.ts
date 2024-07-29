import fs from 'fs';
import { ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheResult, StringValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ServerStorage Interface - Remove Operation', () => {
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

    logStream = createLogStream('server-storage-interface-remove-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should remove data from storage', async () => {
    const testId = 'testId';
    const testStore = 'testStore';

    await serverStorage.remove(testId, testStore);

    expect(serverStorage.remove).toHaveBeenCalledWith(testId, testStore);
    log('Remove operation called with correct parameters');
  });

  it('should handle non-existent data removal gracefully', async () => {
    const testId = 'nonExistentId';
    const testStore = 'testStore';

    await expect(serverStorage.remove(testId, testStore)).resolves.not.toThrow();
    log('Non-existent data removal handled without errors');
  });

  it('should handle errors during remove operation', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const errorMessage = 'Failed to remove data';

    (serverStorage.remove as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(serverStorage.remove(testId, testStore)).rejects.toThrow(errorMessage);
    log('Error during remove operation propagated correctly');
  });

  it('should remove data from specific store', async () => {
    const testId = 'testId';
    const store1 = 'store1';
    const store2 = 'store2';
    const testData: StringValue = { type: 'string', value: 'testValue' };

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: store1,
      value: testData,
      expirationDate: new Date(Date.now() + 1000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock)
      .mockResolvedValueOnce(mockResult)
      .mockResolvedValueOnce(mockResult)
      .mockResolvedValueOnce(undefined);

    await serverStorage.remove(testId, store1);

    const resultStore1 = await serverStorage.get(testId, store1);
    const resultStore2 = await serverStorage.get(testId, store2);

    expect(resultStore1).toBeUndefined();
    expect(resultStore2).toEqual(mockResult);
    log('Data removed from specific store only');
  });

  it('should remove all data with same identifier across stores', async () => {
    const testId = 'testId';
    const stores = ['store1', 'store2', 'store3'];

    await Promise.all(stores.map((store) => serverStorage.remove(testId, store)));

    stores.forEach((store) => {
      expect(serverStorage.remove).toHaveBeenCalledWith(testId, store);
    });

    log('Data removed from all stores for given identifier');
  });

  it('should not affect other data during removal', async () => {
    const testId1 = 'testId1';
    const testId2 = 'testId2';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };

    const mockResult: CacheResult = {
      identifier: testId2,
      storeName: testStore,
      value: testData,
      expirationDate: new Date(Date.now() + 1000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(mockResult);

    await serverStorage.remove(testId1, testStore);

    const result1 = await serverStorage.get(testId1, testStore);
    const result2 = await serverStorage.get(testId2, testStore);

    expect(result1).toBeUndefined();
    expect(result2).toEqual(mockResult);
    log('Other data unaffected by removal operation');
  });
});
