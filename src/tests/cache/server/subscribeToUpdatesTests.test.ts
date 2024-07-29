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

describe('ServerCache Subscribe to Updates Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('subscribe-to-updates-tests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Subscribe to Updates tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should receive updates when subscribing to a specific item', async () => {
    log('Starting test: should receive updates when subscribing to a specific item');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };

    const listener = jest.fn();
    const unsubscribe = serverCache.subscribeToUpdates(identifier, storeName, listener);

    await serverCache.set(identifier, storeName, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName, value2, new Date(Date.now() + 3600000));

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, value1);
    expect(listener).toHaveBeenNthCalledWith(2, value2);

    unsubscribe();

    log('Successfully received updates when subscribing to a specific item');
  });

  it('should not receive updates after unsubscribing', async () => {
    log('Starting test: should not receive updates after unsubscribing');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    const listener = jest.fn();
    const unsubscribe = serverCache.subscribeToUpdates(identifier, storeName, listener);

    unsubscribe();

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    expect(listener).not.toHaveBeenCalled();

    log('Successfully stopped receiving updates after unsubscribing');
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

  it('should handle subscribers for different items independently', async () => {
    log('Starting test: should handle subscribers for different items independently');
    const identifier1 = 'test-item-1';
    const identifier2 = 'test-item-2';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };

    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const unsubscribe1 = serverCache.subscribeToUpdates(identifier1, storeName, listener1);
    const unsubscribe2 = serverCache.subscribeToUpdates(identifier2, storeName, listener2);

    await serverCache.set(identifier1, storeName, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier2, storeName, value2, new Date(Date.now() + 3600000));

    expect(listener1).toHaveBeenCalledWith(value1);
    expect(listener1).not.toHaveBeenCalledWith(value2);
    expect(listener2).toHaveBeenCalledWith(value2);
    expect(listener2).not.toHaveBeenCalledWith(value1);

    unsubscribe1();
    unsubscribe2();

    log('Successfully handled subscribers for different items independently');
  });
});
