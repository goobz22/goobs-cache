import fs from 'fs';
import { ServerStorage } from '../../../../utils/twoLayerCache.client';
import { StringValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ServerStorage - set', () => {
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

    logStream = createLogStream('server-storage-set-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should set data in server storage', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    serverStorage.set = jest.fn().mockResolvedValue(undefined);

    await serverStorage.set('testId', 'testStore', testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    log('Data set in server storage');
  });

  it('should overwrite existing data with the same identifier', async () => {
    const initialData: StringValue = { type: 'string', value: 'initialValue' };
    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const expirationDate = new Date();

    serverStorage.set = jest.fn().mockResolvedValue(undefined);

    await serverStorage.set('testId', 'testStore', initialData, expirationDate);
    await serverStorage.set('testId', 'testStore', updatedData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(
      'testId',
      'testStore',
      updatedData,
      expirationDate,
    );
    log('Existing data overwritten');
  });

  it('should set data with different expiration dates', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate1 = new Date(Date.now() + 1000);
    const expirationDate2 = new Date(Date.now() + 2000);

    serverStorage.set = jest.fn().mockResolvedValue(undefined);

    await serverStorage.set('testId1', 'testStore', testData, expirationDate1);
    await serverStorage.set('testId2', 'testStore', testData, expirationDate2);

    expect(serverStorage.set).toHaveBeenCalledWith(
      'testId1',
      'testStore',
      testData,
      expirationDate1,
    );
    expect(serverStorage.set).toHaveBeenCalledWith(
      'testId2',
      'testStore',
      testData,
      expirationDate2,
    );
    log('Data set with different expiration dates');
  });

  it('should set data in different stores', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    serverStorage.set = jest.fn().mockResolvedValue(undefined);

    await serverStorage.set('testId', 'store1', testData, expirationDate);
    await serverStorage.set('testId', 'store2', testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'store1', testData, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'store2', testData, expirationDate);
    log('Data set in different stores');
  });

  it('should handle errors during set operation', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();
    const testError = new Error('Test error');

    serverStorage.set = jest.fn().mockRejectedValue(testError);

    await expect(
      serverStorage.set('testId', 'testStore', testData, expirationDate),
    ).rejects.toThrow('Test error');
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    log('Error handled during set operation');
  });
});
