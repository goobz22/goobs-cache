import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';
import SessionStorageCache from '../../../cache/session.client';
import { DataValue } from '../../../types';

const logStream = createLogStream('subscribeToUpdatesTests.log');
const log = createLogger(logStream);

describe('SessionStorageCache subscribeToUpdates tests', () => {
  let sessionStorageCache: SessionStorageCache;

  beforeEach(() => {
    setMockedGlobals();
    sessionStorageCache = new SessionStorageCache(mockCacheConfig);
    setupErrorHandling(log, logStream);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should notify subscribers when data is updated', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const initialData: DataValue = { type: 'string', value: 'initial value' };
    const updatedData: DataValue = { type: 'string', value: 'updated value' };

    const listenerMock = jest.fn();

    const unsubscribe = sessionStorageCache.subscribeToUpdates<DataValue>(
      identifier,
      storeName,
      listenerMock,
    );

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, initialData, new Date(Date.now() + 3600000));
      resolve();
    });

    expect(listenerMock).toHaveBeenCalledWith(initialData);

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, updatedData, new Date(Date.now() + 3600000));
      resolve();
    });

    expect(listenerMock).toHaveBeenCalledWith(updatedData);
    expect(listenerMock).toHaveBeenCalledTimes(2);

    unsubscribe();
    log('Subscriber notification test passed');
  });

  it('should stop notifying after unsubscribe', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const initialData: DataValue = { type: 'string', value: 'initial value' };
    const updatedData: DataValue = { type: 'string', value: 'updated value' };

    const listenerMock = jest.fn();

    const unsubscribe = sessionStorageCache.subscribeToUpdates<DataValue>(
      identifier,
      storeName,
      listenerMock,
    );

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, initialData, new Date(Date.now() + 3600000));
      resolve();
    });

    expect(listenerMock).toHaveBeenCalledWith(initialData);

    unsubscribe();

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, updatedData, new Date(Date.now() + 3600000));
      resolve();
    });

    expect(listenerMock).toHaveBeenCalledTimes(1);
    log('Unsubscribe test passed');
  });

  it('should handle multiple subscribers for the same key', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    const listenerMock1 = jest.fn();
    const listenerMock2 = jest.fn();

    sessionStorageCache.subscribeToUpdates<DataValue>(identifier, storeName, listenerMock1);
    sessionStorageCache.subscribeToUpdates<DataValue>(identifier, storeName, listenerMock2);

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    expect(listenerMock1).toHaveBeenCalledWith(testData);
    expect(listenerMock2).toHaveBeenCalledWith(testData);
    log('Multiple subscribers test passed');
  });

  it('should handle subscribers for different keys independently', async () => {
    const identifier1 = 'test-identifier-1';
    const identifier2 = 'test-identifier-2';
    const storeName = 'test-store';
    const testData1: DataValue = { type: 'string', value: 'test value 1' };
    const testData2: DataValue = { type: 'string', value: 'test value 2' };

    const listenerMock1 = jest.fn();
    const listenerMock2 = jest.fn();

    sessionStorageCache.subscribeToUpdates<DataValue>(identifier1, storeName, listenerMock1);
    sessionStorageCache.subscribeToUpdates<DataValue>(identifier2, storeName, listenerMock2);

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier1, storeName, testData1, new Date(Date.now() + 3600000));
      resolve();
    });

    expect(listenerMock1).toHaveBeenCalledWith(testData1);
    expect(listenerMock2).not.toHaveBeenCalled();

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier2, storeName, testData2, new Date(Date.now() + 3600000));
      resolve();
    });

    expect(listenerMock1).toHaveBeenCalledTimes(1);
    expect(listenerMock2).toHaveBeenCalledWith(testData2);
    log('Independent subscribers test passed');
  });
});
