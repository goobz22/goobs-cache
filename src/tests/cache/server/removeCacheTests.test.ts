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

describe('ServerCache Remove Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('remove-cache-tests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Remove tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should remove an existing item from the cache', async () => {
    log('Starting test: should remove an existing item from the cache');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
    await serverCache.remove(identifier, storeName);

    const result = await serverCache.get(identifier, storeName);

    expect(result.value).toBeUndefined();
    log('Successfully removed an existing item from the cache');
  });

  it('should handle removing a non-existent item gracefully', async () => {
    log('Starting test: should handle removing a non-existent item gracefully');
    const identifier = 'non-existent-item';
    const storeName = 'test-store';

    await serverCache.remove(identifier, storeName);

    const result = await serverCache.get(identifier, storeName);

    expect(result.value).toBeUndefined();
    log('Successfully handled removing a non-existent item gracefully');
  });

  it('should reset hit counts and last updated/accessed times when removing an item', async () => {
    log(
      'Starting test: should reset hit counts and last updated/accessed times when removing an item',
    );
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
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(new Date(0));
    log('Successfully reset hit counts and last updated/accessed times when removing an item');
  });

  it('should handle removing items from different stores independently', async () => {
    log('Starting test: should handle removing items from different stores independently');
    const identifier = 'test-item';
    const storeName1 = 'test-store-1';
    const storeName2 = 'test-store-2';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };

    await serverCache.set(identifier, storeName1, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName2, value2, new Date(Date.now() + 3600000));
    await serverCache.remove(identifier, storeName1);

    const result1 = await serverCache.get(identifier, storeName1);
    const result2 = await serverCache.get(identifier, storeName2);

    expect(result1.value).toBeUndefined();
    expect(result2.value).toEqual(value2);
    log('Successfully handled removing items from different stores independently');
  });
});
