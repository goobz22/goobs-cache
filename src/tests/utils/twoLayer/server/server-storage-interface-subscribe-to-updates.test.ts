import fs from 'fs';
import { ServerStorage } from '../../../../utils/twoLayerCache.server';
import { StringValue, ListValue, HashValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ServerStorage Interface - Subscribe to Updates Operation', () => {
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

    logStream = createLogStream('server-storage-interface-subscribe-to-updates-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should subscribe to updates for a specific identifier and store', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();

    serverStorage.subscribeToUpdates(testId, testStore, listener);

    expect(serverStorage.subscribeToUpdates).toHaveBeenCalledWith(testId, testStore, listener);
    log('Subscribed to updates for specific identifier and store');
  });

  it('should call listener when updates occur', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();
    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };

    (serverStorage.subscribeToUpdates as jest.Mock).mockImplementation((id, store, cb) => {
      cb(updatedData);
      return jest.fn();
    });

    serverStorage.subscribeToUpdates(testId, testStore, listener);

    expect(listener).toHaveBeenCalledWith(updatedData);
    log('Listener called with updated data');
  });

  it('should handle multiple subscriptions for the same identifier and store', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    serverStorage.subscribeToUpdates(testId, testStore, listener1);
    serverStorage.subscribeToUpdates(testId, testStore, listener2);

    expect(serverStorage.subscribeToUpdates).toHaveBeenCalledTimes(2);
    expect(serverStorage.subscribeToUpdates).toHaveBeenNthCalledWith(
      1,
      testId,
      testStore,
      listener1,
    );
    expect(serverStorage.subscribeToUpdates).toHaveBeenNthCalledWith(
      2,
      testId,
      testStore,
      listener2,
    );
    log('Multiple subscriptions handled for the same identifier and store');
  });

  it('should handle subscriptions for different data types', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const stringListener = jest.fn();
    const listListener = jest.fn();
    const hashListener = jest.fn();

    const stringData: StringValue = { type: 'string', value: 'updatedString' };
    const listData: ListValue = { type: 'list', value: ['item1', 'item2'] };
    const hashData: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };

    (serverStorage.subscribeToUpdates as jest.Mock)
      .mockImplementationOnce((id, store, cb) => {
        cb(stringData);
        return jest.fn();
      })
      .mockImplementationOnce((id, store, cb) => {
        cb(listData);
        return jest.fn();
      })
      .mockImplementationOnce((id, store, cb) => {
        cb(hashData);
        return jest.fn();
      });

    serverStorage.subscribeToUpdates(testId, testStore, stringListener);
    serverStorage.subscribeToUpdates(testId, testStore, listListener);
    serverStorage.subscribeToUpdates(testId, testStore, hashListener);

    expect(stringListener).toHaveBeenCalledWith(stringData);
    expect(listListener).toHaveBeenCalledWith(listData);
    expect(hashListener).toHaveBeenCalledWith(hashData);
    log('Subscriptions handled for different data types');
  });

  it('should return an unsubscribe function', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();
    const unsubscribeMock = jest.fn();

    (serverStorage.subscribeToUpdates as jest.Mock).mockReturnValue(unsubscribeMock);

    const unsubscribe = serverStorage.subscribeToUpdates(testId, testStore, listener);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
    expect(unsubscribeMock).toHaveBeenCalled();
    log('Unsubscribe function returned and called');
  });

  it('should handle errors in listener gracefully', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const errorListener = jest.fn().mockImplementation(() => {
      throw new Error('Listener error');
    });
    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };

    (serverStorage.subscribeToUpdates as jest.Mock).mockImplementation((id, store, cb) => {
      cb(updatedData);
      return jest.fn();
    });

    expect(() => {
      serverStorage.subscribeToUpdates(testId, testStore, errorListener);
    }).not.toThrow();

    expect(errorListener).toHaveBeenCalledWith(updatedData);
    log('Errors in listener handled gracefully');
  });

  it('should not affect other subscriptions when one errors', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const errorListener = jest.fn().mockImplementation(() => {
      throw new Error('Listener error');
    });
    const validListener = jest.fn();
    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };

    (serverStorage.subscribeToUpdates as jest.Mock).mockImplementation((id, store, cb) => {
      cb(updatedData);
      return jest.fn();
    });

    serverStorage.subscribeToUpdates(testId, testStore, errorListener);
    serverStorage.subscribeToUpdates(testId, testStore, validListener);

    expect(errorListener).toHaveBeenCalledWith(updatedData);
    expect(validListener).toHaveBeenCalledWith(updatedData);
    log('Other subscriptions unaffected by erroring subscription');
  });
});
