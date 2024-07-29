import fs from 'fs';
import { ClientStorage } from '../../../../utils/twoLayerCache.client';
import { StringValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ClientStorage - clear', () => {
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

    logStream = createLogStream('client-storage-clear-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should clear all data from client storage', () => {
    const testData1: StringValue = { type: 'string', value: 'testValue1' };
    const testData2: StringValue = { type: 'string', value: 'testValue2' };
    const expirationDate = new Date();

    clientStorage.set('testId1', 'testStore', testData1, expirationDate);
    clientStorage.set('testId2', 'testStore', testData2, expirationDate);

    clientStorage.clear();

    expect(clientStorage.get).not.toHaveBeenCalled();
    expect(clientStorage.set).toHaveBeenCalledTimes(2);
    expect(clientStorage.remove).not.toHaveBeenCalled();
    expect(clientStorage.clear).toHaveBeenCalledTimes(1);

    clientStorage.get('testId1', 'testStore', (result) => {
      expect(result).toBeUndefined();
    });

    clientStorage.get('testId2', 'testStore', (result) => {
      expect(result).toBeUndefined();
    });

    log('All data cleared from client storage');
  });

  it('should handle clear when client storage is empty', () => {
    clientStorage.clear();

    expect(clientStorage.get).not.toHaveBeenCalled();
    expect(clientStorage.set).not.toHaveBeenCalled();
    expect(clientStorage.remove).not.toHaveBeenCalled();
    expect(clientStorage.clear).toHaveBeenCalledTimes(1);

    log('Clear handled when client storage is empty');
  });
});
