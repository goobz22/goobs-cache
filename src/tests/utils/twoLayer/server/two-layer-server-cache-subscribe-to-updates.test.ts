import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, ListValue, HashValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Subscribe to Updates', () => {
  let serverStorage: ServerStorage;
  let cache: TwoLayerServerCache;
  let defaultConfig: CacheConfig;
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

    defaultConfig = mockCacheConfig;

    cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    logStream = createLogStream('two-layer-server-cache-subscribe-to-updates-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should subscribe to updates for a specific identifier and store', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();

    cache.subscribeToUpdates(testId, testStore, listener);

    expect(serverStorage.subscribeToUpdates).toHaveBeenCalledWith(
      testId,
      testStore,
      expect.any(Function),
    );
    log('Subscribed to updates successfully');
  });

  it('should call listener when updates occur', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();
    const testData: StringValue = { type: 'string', value: 'updatedValue' };

    cache.subscribeToUpdates(testId, testStore, listener);

    // Simulate an update
    const updateCallback = (serverStorage.subscribeToUpdates as jest.Mock).mock.calls[0][2];
    updateCallback(testData);

    expect(listener).toHaveBeenCalledWith(testData);
    log('Listener called with updated data');
  });

  it('should handle multiple subscriptions for the same identifier and store', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    cache.subscribeToUpdates(testId, testStore, listener1);
    cache.subscribeToUpdates(testId, testStore, listener2);

    expect(serverStorage.subscribeToUpdates).toHaveBeenCalledTimes(2);
    log('Multiple subscriptions handled for the same identifier and store');
  });

  it('should handle subscriptions for different data types', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const stringListener = jest.fn();
    const listListener = jest.fn();
    const hashListener = jest.fn();

    cache.subscribeToUpdates(testId, testStore, stringListener);
    cache.subscribeToUpdates(testId, testStore, listListener);
    cache.subscribeToUpdates(testId, testStore, hashListener);

    const updateCallback = (serverStorage.subscribeToUpdates as jest.Mock).mock.calls[0][2];

    const stringData: StringValue = { type: 'string', value: 'updatedString' };
    updateCallback(stringData);
    expect(stringListener).toHaveBeenCalledWith(stringData);

    const listData: ListValue = { type: 'list', value: ['item1', 'item2'] };
    updateCallback(listData);
    expect(listListener).toHaveBeenCalledWith(listData);

    const hashData: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };
    updateCallback(hashData);
    expect(hashListener).toHaveBeenCalledWith(hashData);

    log('Subscriptions handled for different data types');
  });

  it('should unsubscribe correctly', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();

    const unsubscribe = jest.fn();
    (serverStorage.subscribeToUpdates as jest.Mock).mockReturnValue(unsubscribe);

    const unsubscribeFunc = cache.subscribeToUpdates(testId, testStore, listener);

    unsubscribeFunc();

    expect(unsubscribe).toHaveBeenCalled();
    log('Unsubscribe function called correctly');
  });

  it('should not call listener after unsubscribing', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();
    const testData: StringValue = { type: 'string', value: 'updatedValue' };

    const unsubscribeFunc = cache.subscribeToUpdates(testId, testStore, listener);

    // Simulate an update
    const updateCallback = (serverStorage.subscribeToUpdates as jest.Mock).mock.calls[0][2];
    updateCallback(testData);

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribeFunc();

    // Simulate another update after unsubscribing
    updateCallback(testData);

    expect(listener).toHaveBeenCalledTimes(1); // Still only called once
    log('Listener not called after unsubscribing');
  });

  it('should handle errors in listener gracefully', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const errorListener = jest.fn().mockImplementation(() => {
      throw new Error('Listener error');
    });
    const testData: StringValue = { type: 'string', value: 'updatedValue' };

    cache.subscribeToUpdates(testId, testStore, errorListener);

    // Simulate an update
    const updateCallback = (serverStorage.subscribeToUpdates as jest.Mock).mock.calls[0][2];

    expect(() => updateCallback(testData)).not.toThrow();
    expect(errorListener).toHaveBeenCalledWith(testData);
    log('Errors in listener handled gracefully');
  });

  it('should maintain subscriptions after cache operations', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    cache.subscribeToUpdates(testId, testStore, listener);

    await cache.set(testId, testStore, testData, expirationDate);
    await cache.get(testId, testStore);
    await cache.remove(testId, testStore);

    // Simulate an update after operations
    const updateCallback = (serverStorage.subscribeToUpdates as jest.Mock).mock.calls[0][2];
    updateCallback(testData);

    expect(listener).toHaveBeenCalledWith(testData);
    log('Subscriptions maintained after cache operations');
  });
});
