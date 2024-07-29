import { jest, describe, it, beforeAll, beforeEach, afterAll, expect } from '@jest/globals';
import {
  MockServerCache,
  createServerCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/server/serverCache.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { DataValue, EvictionPolicy } from '../../../types';

jest.mock('../../../jest/mocks/cache/server/serverCache.mock');
jest.mock('../../../jest/reusableJest/logging');
jest.mock('../../../jest/reusableJest/errorHandling');

describe('ServerCache Eviction Policy Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('eviction-policy-tests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Eviction Policy tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should evict least recently used items when cache is full', async () => {
    log('Starting test: should evict least recently used items when cache is full');
    const identifier1 = 'test-item-1';
    const identifier2 = 'test-item-2';
    const identifier3 = 'test-item-3';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };
    const value3: DataValue = { type: 'string', value: 'Test value 3' };

    await serverCache.set(identifier1, storeName, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier2, storeName, value2, new Date(Date.now() + 3600000));
    await serverCache.set(identifier3, storeName, value3, new Date(Date.now() + 3600000));

    const result1 = await serverCache.get(identifier1, storeName);
    const result2 = await serverCache.get(identifier2, storeName);
    const result3 = await serverCache.get(identifier3, storeName);

    expect(result1.value).toBeUndefined();
    expect(result2.value).toEqual(value2);
    expect(result3.value).toEqual(value3);

    log('Successfully evicted least recently used item');
  });

  it('should evict least frequently used items when cache is full', async () => {
    log('Starting test: should evict least frequently used items when cache is full');
    const identifier1 = 'test-item-1';
    const identifier2 = 'test-item-2';
    const identifier3 = 'test-item-3';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };
    const value3: DataValue = { type: 'string', value: 'Test value 3' };

    await serverCache.setEvictionPolicy('lfu');

    await serverCache.set(identifier1, storeName, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier2, storeName, value2, new Date(Date.now() + 3600000));
    await serverCache.set(identifier3, storeName, value3, new Date(Date.now() + 3600000));

    await serverCache.get(identifier1, storeName);
    await serverCache.get(identifier2, storeName);
    await serverCache.get(identifier2, storeName);

    const result1 = await serverCache.get(identifier1, storeName);
    const result2 = await serverCache.get(identifier2, storeName);
    const result3 = await serverCache.get(identifier3, storeName);

    expect(result1.value).toBeUndefined();
    expect(result2.value).toEqual(value2);
    expect(result3.value).toBeUndefined();

    log('Successfully evicted least frequently used item');
  });

  it('should handle invalid eviction policy gracefully', async () => {
    log('Starting test: should handle invalid eviction policy gracefully');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    const invalidPolicy = 'invalid-policy';
    await expect(serverCache.setEvictionPolicy(invalidPolicy as EvictionPolicy)).rejects.toThrow();

    const result = await serverCache.get(identifier, storeName);

    expect(result.value).toEqual(value);

    log('Successfully handled invalid eviction policy');
  });
});
