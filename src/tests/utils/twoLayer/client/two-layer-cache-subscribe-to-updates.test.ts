import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - subscribeToUpdates', () => {
  let clientStorage: ClientStorage;
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
  let cache: TwoLayerClientCache;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    clientStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    };

    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    defaultConfig = mockCacheConfig;
    cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);

    logStream = createLogStream('two-layer-cache-subscribe-to-updates-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should subscribe to updates', () => {
    const listener = jest.fn();
    const unsubscribe = cache.subscribeToUpdates('testId', 'testStore', listener);

    expect(serverStorage.subscribeToUpdates).toHaveBeenCalledWith(
      'testId',
      'testStore',
      expect.any(Function),
    );
    expect(typeof unsubscribe).toBe('function');
    log('Subscribed to updates');
  });

  it('should update client storage when receiving updates', () => {
    const listener = jest.fn();
    cache.subscribeToUpdates('testId', 'testStore', listener);

    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const mockUpdate = serverStorage.subscribeToUpdates as jest.Mock;
    mockUpdate.mock.calls[0][2](updatedData);

    expect(clientStorage.set).toHaveBeenCalledWith(
      'testId',
      'testStore',
      updatedData,
      expect.any(Date),
    );
    expect(listener).toHaveBeenCalledWith(updatedData);
    log('Updated client storage and notified listener');
  });

  it('should unsubscribe from updates', () => {
    const listener = jest.fn();
    const unsubscribe = cache.subscribeToUpdates('testId', 'testStore', listener);

    unsubscribe();

    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const mockUpdate = serverStorage.subscribeToUpdates as jest.Mock;
    mockUpdate.mock.calls[0][2](updatedData);

    expect(clientStorage.set).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    log('Unsubscribed from updates');
  });

  it('should handle multiple subscribers', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    cache.subscribeToUpdates('testId', 'testStore', listener1);
    cache.subscribeToUpdates('testId', 'testStore', listener2);

    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const mockUpdate = serverStorage.subscribeToUpdates as jest.Mock;
    mockUpdate.mock.calls[0][2](updatedData);

    expect(clientStorage.set).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith(updatedData);
    expect(listener2).toHaveBeenCalledWith(updatedData);
    log('Handled multiple subscribers');
  });

  it('should handle subscription to different stores', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    cache.subscribeToUpdates('testId', 'store1', listener1);
    cache.subscribeToUpdates('testId', 'store2', listener2);

    const updatedData1: StringValue = { type: 'string', value: 'updatedValue1' };
    const updatedData2: StringValue = { type: 'string', value: 'updatedValue2' };
    const mockUpdate = serverStorage.subscribeToUpdates as jest.Mock;
    mockUpdate.mock.calls[0][2](updatedData1);
    mockUpdate.mock.calls[1][2](updatedData2);

    expect(clientStorage.set).toHaveBeenCalledWith(
      'testId',
      'store1',
      updatedData1,
      expect.any(Date),
    );
    expect(clientStorage.set).toHaveBeenCalledWith(
      'testId',
      'store2',
      updatedData2,
      expect.any(Date),
    );
    expect(listener1).toHaveBeenCalledWith(updatedData1);
    expect(listener2).toHaveBeenCalledWith(updatedData2);
    log('Handled subscription to different stores');
  });
});
