import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';
import SessionStorageCache from '../../../cache/session.client';
import { DataValue } from '../../../types';

const logStream = createLogStream('realTimeSyncTests.log');
const log = createLogger(logStream);

describe('SessionStorageCache real-time sync tests', () => {
  let sessionStorageCache: SessionStorageCache;

  beforeEach(() => {
    setMockedGlobals();
    sessionStorageCache = new SessionStorageCache(mockCacheConfig);
    setupErrorHandling(log, logStream);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should notify subscribers when setting a value', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    const mockSubscriber = jest.fn();
    const unsubscribe = sessionStorageCache.subscribeToUpdates(
      identifier,
      storeName,
      mockSubscriber,
    );

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      setTimeout(resolve, 0);
    });

    expect(mockSubscriber).toHaveBeenCalledWith(testData);
    unsubscribe();
    log('Subscriber notification on set test passed');
  });

  it('should not notify unsubscribed listeners', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    const mockSubscriber = jest.fn();
    const unsubscribe = sessionStorageCache.subscribeToUpdates(
      identifier,
      storeName,
      mockSubscriber,
    );

    unsubscribe();

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      setTimeout(resolve, 0);
    });

    expect(mockSubscriber).not.toHaveBeenCalled();
    log('Unsubscribed listener test passed');
  });

  it('should notify multiple subscribers for the same identifier and storeName', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    const mockSubscriber1 = jest.fn();
    const mockSubscriber2 = jest.fn();

    const unsubscribe1 = sessionStorageCache.subscribeToUpdates(
      identifier,
      storeName,
      mockSubscriber1,
    );
    const unsubscribe2 = sessionStorageCache.subscribeToUpdates(
      identifier,
      storeName,
      mockSubscriber2,
    );

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      setTimeout(resolve, 0);
    });

    expect(mockSubscriber1).toHaveBeenCalledWith(testData);
    expect(mockSubscriber2).toHaveBeenCalledWith(testData);

    unsubscribe1();
    unsubscribe2();
    log('Multiple subscribers notification test passed');
  });

  it('should only notify subscribers for the specific identifier and storeName', async () => {
    const identifier1 = 'test-identifier-1';
    const identifier2 = 'test-identifier-2';
    const storeName = 'test-store';
    const testData1: DataValue = { type: 'string', value: 'test value 1' };
    const testData2: DataValue = { type: 'string', value: 'test value 2' };

    const mockSubscriber1 = jest.fn();
    const mockSubscriber2 = jest.fn();

    const unsubscribe1 = sessionStorageCache.subscribeToUpdates(
      identifier1,
      storeName,
      mockSubscriber1,
    );
    const unsubscribe2 = sessionStorageCache.subscribeToUpdates(
      identifier2,
      storeName,
      mockSubscriber2,
    );

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier1, storeName, testData1, new Date(Date.now() + 3600000));
      setTimeout(resolve, 0);
    });

    expect(mockSubscriber1).toHaveBeenCalledWith(testData1);
    expect(mockSubscriber2).not.toHaveBeenCalled();

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier2, storeName, testData2, new Date(Date.now() + 3600000));
      setTimeout(resolve, 0);
    });

    expect(mockSubscriber2).toHaveBeenCalledWith(testData2);
    expect(mockSubscriber1).toHaveBeenCalledTimes(1);

    unsubscribe1();
    unsubscribe2();
    log('Specific identifier and storeName notification test passed');
  });
});
