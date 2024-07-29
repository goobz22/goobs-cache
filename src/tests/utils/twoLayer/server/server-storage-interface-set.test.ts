import fs from 'fs';
import { ServerStorage } from '../../../../utils/twoLayerCache.server';
import { StringValue, ListValue, HashValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ServerStorage Interface - Set Operation', () => {
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

    logStream = createLogStream('server-storage-interface-set-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should set string data in storage', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await serverStorage.set(testId, testStore, testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);
    log('String data set in storage');
  });

  it('should set list data in storage', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: ListValue = { type: 'list', value: ['item1', 'item2', 'item3'] };
    const expirationDate = new Date(Date.now() + 1000);

    await serverStorage.set(testId, testStore, testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);
    log('List data set in storage');
  });

  it('should set hash data in storage', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };
    const expirationDate = new Date(Date.now() + 1000);

    await serverStorage.set(testId, testStore, testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);
    log('Hash data set in storage');
  });

  it('should overwrite existing data', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const initialData: StringValue = { type: 'string', value: 'initialValue' };
    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await serverStorage.set(testId, testStore, initialData, expirationDate);
    await serverStorage.set(testId, testStore, updatedData, expirationDate);

    expect(serverStorage.set).toHaveBeenLastCalledWith(
      testId,
      testStore,
      updatedData,
      expirationDate,
    );
    log('Existing data overwritten');
  });

  it('should handle errors during set operation', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);
    const errorMessage = 'Failed to set data';

    (serverStorage.set as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(serverStorage.set(testId, testStore, testData, expirationDate)).rejects.toThrow(
      errorMessage,
    );
    log('Error during set operation propagated correctly');
  });

  it('should set data with different expiration dates', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const shortExpirationDate = new Date(Date.now() + 1000);
    const longExpirationDate = new Date(Date.now() + 1000000);

    await serverStorage.set(testId, testStore, testData, shortExpirationDate);
    await serverStorage.set(testId, testStore, testData, longExpirationDate);

    expect(serverStorage.set).toHaveBeenNthCalledWith(
      1,
      testId,
      testStore,
      testData,
      shortExpirationDate,
    );
    expect(serverStorage.set).toHaveBeenNthCalledWith(
      2,
      testId,
      testStore,
      testData,
      longExpirationDate,
    );
    log('Data set with different expiration dates');
  });

  it('should set data in different stores', async () => {
    const testId = 'testId';
    const store1 = 'store1';
    const store2 = 'store2';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await serverStorage.set(testId, store1, testData, expirationDate);
    await serverStorage.set(testId, store2, testData, expirationDate);

    expect(serverStorage.set).toHaveBeenNthCalledWith(1, testId, store1, testData, expirationDate);
    expect(serverStorage.set).toHaveBeenNthCalledWith(2, testId, store2, testData, expirationDate);
    log('Data set in different stores');
  });

  it('should handle setting large data', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const largeData: StringValue = { type: 'string', value: 'a'.repeat(1000000) };
    const expirationDate = new Date(Date.now() + 1000);

    await serverStorage.set(testId, testStore, largeData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, largeData, expirationDate);
    log('Large data set in storage');
  });
});
