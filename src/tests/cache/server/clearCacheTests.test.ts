import { jest } from '@jest/globals';
import { DataValue } from '../../../types';
import {
  MockServerCache,
  createServerCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/server/serverCache.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../jest/reusableJest/performance';

describe('ServerCache clear tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = runTestsWithLogging('clearTests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting tests');
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  afterEach(() => {
    log('Test cleanup complete');
  });

  it('should clear all cached items', async () => {
    log('Starting test: should clear all cached items');
    const identifier1 = 'test-item-1';
    const identifier2 = 'test-item-2';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };

    const executionTime = await measureAsyncExecutionTime(async () => {
      await serverCache.set(identifier1, storeName, value1, new Date(Date.now() + 3600000));
      await serverCache.set(identifier2, storeName, value2, new Date(Date.now() + 3600000));
      log('Test data set');

      await serverCache.clear();
      log('Cache cleared');
    });

    log(`Execution time: ${executionTime}ms`);

    const result1 = await serverCache.get(identifier1, storeName);
    const result2 = await serverCache.get(identifier2, storeName);

    expect(result1.value).toBeUndefined();
    expect(result2.value).toBeUndefined();

    log('Verified cache entries are cleared');
  });

  it('should not affect newly added items after clear', async () => {
    log('Starting test: should not affect newly added items after clear');
    const identifier = 'test-item-post-clear';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value post-clear' };

    const executionTime = await measureAsyncExecutionTime(async () => {
      await serverCache.clear();
      log('Cache cleared');

      await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
      log('Test data set after clear');
    });

    log(`Execution time: ${executionTime}ms`);

    const result = await serverCache.get(identifier, storeName);

    expect(result.value).toEqual(value);

    log('Verified newly added item is not affected by clear');
  });

  it('should handle multiple clear operations', async () => {
    log('Starting test: should handle multiple clear operations');
    const identifier = 'test-item-multiple-clear';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value multiple clear' };

    const executionTime = await measureAsyncExecutionTime(async () => {
      await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
      log('Test data set');

      await serverCache.clear();
      await serverCache.clear();
      log('Multiple clear operations performed');
    });

    log(`Execution time: ${executionTime}ms`);

    const result = await serverCache.get(identifier, storeName);

    expect(result.value).toBeUndefined();

    log('Verified multiple clear operations are handled correctly');
  });

  it('should clear items from all stores', async () => {
    log('Starting test: should clear items from all stores');
    const identifier = 'test-item-multi-store';
    const storeName1 = 'test-store-1';
    const storeName2 = 'test-store-2';
    const value: DataValue = { type: 'string', value: 'Test value multi-store' };

    const executionTime = await measureAsyncExecutionTime(async () => {
      await serverCache.set(identifier, storeName1, value, new Date(Date.now() + 3600000));
      await serverCache.set(identifier, storeName2, value, new Date(Date.now() + 3600000));
      log('Test data set in multiple stores');

      await serverCache.clear();
      log('Cache cleared');
    });

    log(`Execution time: ${executionTime}ms`);

    const result1 = await serverCache.get(identifier, storeName1);
    const result2 = await serverCache.get(identifier, storeName2);

    expect(result1.value).toBeUndefined();
    expect(result2.value).toBeUndefined();

    log('Verified items from all stores are cleared');
  });
});
