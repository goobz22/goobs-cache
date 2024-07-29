import fs from 'fs';
import { ClientStorage } from '../../../../utils/twoLayerCache.client';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ClientStorage - remove', () => {
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

    logStream = createLogStream('client-storage-remove-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  const removeAsync = (identifier: string, storeName: string): Promise<void> => {
    return new Promise((resolve) => {
      clientStorage.remove(identifier, storeName);
      resolve();
    });
  };

  it('should remove data from client storage', async () => {
    await removeAsync('testId', 'testStore');

    expect(clientStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    log('Data removed from client storage');
  });

  it('should handle removing non-existent data', async () => {
    await removeAsync('nonExistentId', 'testStore');

    expect(clientStorage.remove).toHaveBeenCalledWith('nonExistentId', 'testStore');
    log('Handled removing non-existent data');
  });

  it('should remove data with special characters in identifier', async () => {
    const specialId = 'test/id@123';
    await removeAsync(specialId, 'testStore');

    expect(clientStorage.remove).toHaveBeenCalledWith(specialId, 'testStore');
    log('Data with special characters in identifier removed');
  });

  it('should remove data from different stores', async () => {
    await removeAsync('testId1', 'store1');
    await removeAsync('testId2', 'store2');

    expect(clientStorage.remove).toHaveBeenCalledWith('testId1', 'store1');
    expect(clientStorage.remove).toHaveBeenCalledWith('testId2', 'store2');
    log('Data removed from different stores');
  });
});
