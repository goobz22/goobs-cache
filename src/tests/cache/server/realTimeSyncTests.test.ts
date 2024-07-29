import { jest, describe, it, beforeAll, beforeEach, afterAll, expect } from '@jest/globals';
import {
  MockServerCache,
  createServerCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/server/serverCache.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { DataValue } from '../../../types';

jest.mock('../../../jest/mocks/cache/server/serverCache.mock');
jest.mock('../../../jest/reusableJest/logging');
jest.mock('../../../jest/reusableJest/errorHandling');

describe('ServerCache Real-Time Sync Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('real-time-sync-tests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Real-Time Sync tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should notify subscribers when a new item is set', async () => {
    log('Starting test: should notify subscribers when a new item is set');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    const listener = jest.fn();
    const unsubscribe = serverCache.subscribeToUpdates(identifier, storeName, listener);

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    expect(listener).toHaveBeenCalledWith(value);

    unsubscribe();

    log('Successfully notified subscribers when a new item is set');
  });

  it('should notify subscribers when an existing item is updated', async () => {
    log('Starting test: should notify subscribers when an existing item is updated');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };

    await serverCache.set(identifier, storeName, value1, new Date(Date.now() + 3600000));

    const listener = jest.fn();
    const unsubscribe = serverCache.subscribeToUpdates(identifier, storeName, listener);

    await serverCache.set(identifier, storeName, value2, new Date(Date.now() + 3600000));

    expect(listener).toHaveBeenCalledWith(value2);

    unsubscribe();

    log('Successfully notified subscribers when an existing item is updated');
  });

  it('should notify subscribers when an item is removed', async () => {
    log('Starting test: should notify subscribers when an item is removed');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    const listener = jest.fn();
    const unsubscribe = serverCache.subscribeToUpdates(identifier, storeName, listener);

    await serverCache.remove(identifier, storeName);

    expect(listener).toHaveBeenCalledWith(undefined);

    unsubscribe();

    log('Successfully notified subscribers when an item is removed');
  });

  it('should notify subscribers when the cache is cleared', async () => {
    log('Starting test: should notify subscribers when the cache is cleared');
    const identifier1 = 'test-item-1';
    const identifier2 = 'test-item-2';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };

    await serverCache.set(identifier1, storeName, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier2, storeName, value2, new Date(Date.now() + 3600000));

    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const unsubscribe1 = serverCache.subscribeToUpdates(identifier1, storeName, listener1);
    const unsubscribe2 = serverCache.subscribeToUpdates(identifier2, storeName, listener2);

    await serverCache.clear();

    expect(listener1).toHaveBeenCalledWith(undefined);
    expect(listener2).toHaveBeenCalledWith(undefined);

    unsubscribe1();
    unsubscribe2();

    log('Successfully notified subscribers when the cache is cleared');
  });

  it('should handle multiple subscribers for the same item', async () => {
    log('Starting test: should handle multiple subscribers for the same item');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const unsubscribe1 = serverCache.subscribeToUpdates(identifier, storeName, listener1);
    const unsubscribe2 = serverCache.subscribeToUpdates(identifier, storeName, listener2);

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    expect(listener1).toHaveBeenCalledWith(value);
    expect(listener2).toHaveBeenCalledWith(value);

    unsubscribe1();
    unsubscribe2();

    log('Successfully handled multiple subscribers for the same item');
  });
});
