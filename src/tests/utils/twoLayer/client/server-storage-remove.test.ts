import fs from 'fs';
import { ServerStorage } from '../../../../utils/twoLayerCache.client';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ServerStorage - remove', () => {
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

    logStream = createLogStream('server-storage-remove-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should remove data from server storage', async () => {
    serverStorage.remove = jest.fn().mockResolvedValue(undefined);

    await serverStorage.remove('testId', 'testStore');

    expect(serverStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    log('Data removed from server storage');
  });

  it('should handle removing non-existent data', async () => {
    serverStorage.remove = jest.fn().mockResolvedValue(undefined);

    await serverStorage.remove('nonExistentId', 'testStore');

    expect(serverStorage.remove).toHaveBeenCalledWith('nonExistentId', 'testStore');
    log('Handled removing non-existent data');
  });

  it('should remove data with special characters in identifier', async () => {
    const specialId = 'test/id@123';
    serverStorage.remove = jest.fn().mockResolvedValue(undefined);

    await serverStorage.remove(specialId, 'testStore');

    expect(serverStorage.remove).toHaveBeenCalledWith(specialId, 'testStore');
    log('Data with special characters in identifier removed');
  });

  it('should remove data from different stores', async () => {
    serverStorage.remove = jest.fn().mockResolvedValue(undefined);

    await serverStorage.remove('testId1', 'store1');
    await serverStorage.remove('testId2', 'store2');

    expect(serverStorage.remove).toHaveBeenCalledWith('testId1', 'store1');
    expect(serverStorage.remove).toHaveBeenCalledWith('testId2', 'store2');
    log('Data removed from different stores');
  });

  it('should handle errors during remove operation', async () => {
    const testError = new Error('Test error');
    serverStorage.remove = jest.fn().mockRejectedValue(testError);

    await expect(serverStorage.remove('testId', 'testStore')).rejects.toThrow('Test error');
    expect(serverStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    log('Error handled during remove operation');
  });
});
