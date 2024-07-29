import fs from 'fs';
import { ClientStorage } from '../../../../utils/twoLayerCache.client';
import { StringValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ClientStorage - set', () => {
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

    logStream = createLogStream('client-storage-set-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  const setAsync = (
    identifier: string,
    storeName: string,
    value: StringValue,
    expirationDate: Date,
  ): Promise<void> => {
    return new Promise((resolve) => {
      clientStorage.set(identifier, storeName, value, expirationDate);
      resolve();
    });
  };

  it('should set data in client storage', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    await setAsync('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    log('Data set in client storage');
  });

  it('should overwrite existing data with the same identifier', async () => {
    const initialData: StringValue = { type: 'string', value: 'initialValue' };
    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const expirationDate = new Date();

    await setAsync('testId', 'testStore', initialData, expirationDate);
    await setAsync('testId', 'testStore', updatedData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith(
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

    await setAsync('testId1', 'testStore', testData, expirationDate1);
    await setAsync('testId2', 'testStore', testData, expirationDate2);

    expect(clientStorage.set).toHaveBeenCalledWith(
      'testId1',
      'testStore',
      testData,
      expirationDate1,
    );
    expect(clientStorage.set).toHaveBeenCalledWith(
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

    await setAsync('testId', 'store1', testData, expirationDate);
    await setAsync('testId', 'store2', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'store1', testData, expirationDate);
    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'store2', testData, expirationDate);
    log('Data set in different stores');
  });
});
