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

describe('ServerCache Hit Count Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('hit-count-tests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Hit Count tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should increment the get hit count when an item is retrieved', async () => {
    log('Starting test: should increment the get hit count when an item is retrieved');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    await serverCache.get(identifier, storeName);
    await serverCache.get(identifier, storeName);
    await serverCache.get(identifier, storeName);

    const result = await serverCache.get(identifier, storeName);

    expect(result.getHitCount).toBe(4);

    log('Successfully incremented the get hit count when an item is retrieved');
  });

  it('should increment the set hit count when an item is set', async () => {
    log('Starting test: should increment the set hit count when an item is set');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    const result = await serverCache.get(identifier, storeName);

    expect(result.setHitCount).toBe(3);

    log('Successfully incremented the set hit count when an item is set');
  });

  it('should reset hit counts when an item is removed', async () => {
    log('Starting test: should reset hit counts when an item is removed');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    await serverCache.get(identifier, storeName);
    await serverCache.get(identifier, storeName);
    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    await serverCache.remove(identifier, storeName);

    const result = await serverCache.get(identifier, storeName);

    expect(result.getHitCount).toBe(0);
    expect(result.setHitCount).toBe(0);

    log('Successfully reset hit counts when an item is removed');
  });

  it('should handle hit counts correctly for multiple items', async () => {
    log('Starting test: should handle hit counts correctly for multiple items');
    const identifier1 = 'test-item-1';
    const identifier2 = 'test-item-2';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };

    await serverCache.set(identifier1, storeName, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier2, storeName, value2, new Date(Date.now() + 3600000));

    await serverCache.get(identifier1, storeName);
    await serverCache.get(identifier1, storeName);
    await serverCache.set(identifier1, storeName, value1, new Date(Date.now() + 3600000));

    await serverCache.get(identifier2, storeName);
    await serverCache.set(identifier2, storeName, value2, new Date(Date.now() + 3600000));
    await serverCache.set(identifier2, storeName, value2, new Date(Date.now() + 3600000));

    const result1 = await serverCache.get(identifier1, storeName);
    const result2 = await serverCache.get(identifier2, storeName);

    expect(result1.getHitCount).toBe(3);
    expect(result1.setHitCount).toBe(2);
    expect(result2.getHitCount).toBe(2);
    expect(result2.setHitCount).toBe(3);

    log('Successfully handled hit counts correctly for multiple items');
  });
});
