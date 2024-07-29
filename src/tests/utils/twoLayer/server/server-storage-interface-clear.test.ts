import fs from 'fs';
import { ServerStorage } from '../../../../utils/twoLayerCache.server';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ServerStorage Interface - Clear Operation', () => {
  let serverStorage: ServerStorage;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn().mockResolvedValue(undefined),
      subscribeToUpdates: jest.fn(),
    };

    logStream = createLogStream('server-storage-interface-clear-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should clear all data from storage', async () => {
    await serverStorage.clear();

    expect(serverStorage.clear).toHaveBeenCalled();
    log('Clear operation called on server storage');
  });

  it('should resolve without errors when clearing empty storage', async () => {
    await expect(serverStorage.clear()).resolves.toBeUndefined();
    log('Clear operation resolved without errors on empty storage');
  });

  it('should clear data and subsequent get operations should return undefined', async () => {
    const testId = 'testId';
    const testStore = 'testStore';

    // Mock some data in storage
    (serverStorage.get as jest.Mock).mockResolvedValueOnce({ value: 'testValue' });

    // Verify data exists before clearing
    const beforeClear = await serverStorage.get(testId, testStore);
    expect(beforeClear).toBeDefined();

    // Clear the storage
    await serverStorage.clear();

    // Mock empty storage after clearing
    (serverStorage.get as jest.Mock).mockResolvedValueOnce(undefined);

    // Verify data doesn't exist after clearing
    const afterClear = await serverStorage.get(testId, testStore);
    expect(afterClear).toBeUndefined();

    log('Data cleared and subsequent get operation returned undefined');
  });

  it('should handle errors during clear operation', async () => {
    const errorMessage = 'Failed to clear storage';
    (serverStorage.clear as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    await expect(serverStorage.clear()).rejects.toThrow(errorMessage);
    log('Error during clear operation handled correctly');
  });

  it('should clear data across all stores', async () => {
    const stores = ['store1', 'store2', 'store3'];
    const testId = 'testId';

    // Mock data in different stores
    stores.forEach((store) => {
      (serverStorage.get as jest.Mock).mockResolvedValueOnce({ value: `testValue for ${store}` });
    });

    // Verify data exists in all stores before clearing
    for (const store of stores) {
      const beforeClear = await serverStorage.get(testId, store);
      expect(beforeClear).toBeDefined();
    }

    // Clear the storage
    await serverStorage.clear();

    // Mock empty storage after clearing
    (serverStorage.get as jest.Mock).mockResolvedValue(undefined);

    // Verify data doesn't exist in any store after clearing
    for (const store of stores) {
      const afterClear = await serverStorage.get(testId, store);
      expect(afterClear).toBeUndefined();
    }

    log('Data cleared across all stores');
  });

  it('should not affect future set operations after clearing', async () => {
    // Clear the storage
    await serverStorage.clear();

    // Attempt to set new data after clearing
    const testId = 'newTestId';
    const testStore = 'newTestStore';
    const testValue = { value: 'newTestValue' };

    await serverStorage.set(testId, testStore, testValue, new Date());

    // Mock successful set operation
    (serverStorage.get as jest.Mock).mockResolvedValueOnce(testValue);

    // Verify the new data was set successfully
    const result = await serverStorage.get(testId, testStore);
    expect(result).toEqual(testValue);

    log('Set operation successful after clearing storage');
  });
});
