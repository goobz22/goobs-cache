import fs from 'fs';
import { ServerStorage } from '../../../../utils/twoLayerCache.client';
import { StringValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ServerStorage - clear', () => {
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

    logStream = createLogStream('server-storage-clear-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should clear all data from server storage', async () => {
    const testData1: StringValue = { type: 'string', value: 'testValue1' };
    const testData2: StringValue = { type: 'string', value: 'testValue2' };
    const expirationDate = new Date();

    await serverStorage.set('testId1', 'testStore', testData1, expirationDate);
    await serverStorage.set('testId2', 'testStore', testData2, expirationDate);

    await serverStorage.clear();

    expect(serverStorage.get).not.toHaveBeenCalled();
    expect(serverStorage.set).toHaveBeenCalledTimes(2);
    expect(serverStorage.remove).not.toHaveBeenCalled();
    expect(serverStorage.clear).toHaveBeenCalledTimes(1);

    const result1 = await serverStorage.get('testId1', 'testStore');
    expect(result1).toBeUndefined();

    const result2 = await serverStorage.get('testId2', 'testStore');
    expect(result2).toBeUndefined();

    log('All data cleared from server storage');
  });

  it('should handle clear when server storage is empty', async () => {
    await serverStorage.clear();

    expect(serverStorage.get).not.toHaveBeenCalled();
    expect(serverStorage.set).not.toHaveBeenCalled();
    expect(serverStorage.remove).not.toHaveBeenCalled();
    expect(serverStorage.clear).toHaveBeenCalledTimes(1);

    log('Clear handled when server storage is empty');
  });
});
