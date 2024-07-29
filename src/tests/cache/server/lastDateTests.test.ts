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

describe('ServerCache Last Date Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('last-date-tests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Last Date tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should update the last updated date when an item is set', async () => {
    log('Starting test: should update the last updated date when an item is set');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    const result = await serverCache.get(identifier, storeName);

    expect(result.lastUpdatedDate).toBeInstanceOf(Date);
    expect(result.lastUpdatedDate.getTime()).toBeGreaterThan(0);

    log('Successfully updated the last updated date when an item is set');
  });

  it('should update the last accessed date when an item is retrieved', async () => {
    log('Starting test: should update the last accessed date when an item is retrieved');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    const initialResult = await serverCache.get(identifier, storeName);
    const initialAccessedDate = initialResult.lastAccessedDate;

    // Use Jest's fake timers to advance time
    jest.advanceTimersByTime(100);

    const updatedResult = await serverCache.get(identifier, storeName);
    const updatedAccessedDate = updatedResult.lastAccessedDate;

    expect(updatedAccessedDate).toBeInstanceOf(Date);
    expect(updatedAccessedDate.getTime()).toBeGreaterThan(initialAccessedDate.getTime());

    log('Successfully updated the last accessed date when an item is retrieved');
  });

  it('should reset last updated and accessed dates when an item is removed', async () => {
    log('Starting test: should reset last updated and accessed dates when an item is removed');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    await serverCache.remove(identifier, storeName);

    const result = await serverCache.get(identifier, storeName);

    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(new Date(0));

    log('Successfully reset last updated and accessed dates when an item is removed');
  });

  it('should handle last dates correctly for multiple items', async () => {
    log('Starting test: should handle last dates correctly for multiple items');
    const identifier1 = 'test-item-1';
    const identifier2 = 'test-item-2';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };

    await serverCache.set(identifier1, storeName, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier2, storeName, value2, new Date(Date.now() + 3600000));

    // Use Jest's fake timers to advance time
    jest.advanceTimersByTime(100);

    await serverCache.get(identifier1, storeName);

    const result1 = await serverCache.get(identifier1, storeName);
    const result2 = await serverCache.get(identifier2, storeName);

    expect(result1.lastUpdatedDate).toBeInstanceOf(Date);
    expect(result1.lastUpdatedDate.getTime()).toBeGreaterThan(0);
    expect(result1.lastAccessedDate).toBeInstanceOf(Date);
    expect(result1.lastAccessedDate.getTime()).toBeGreaterThan(result1.lastUpdatedDate.getTime());

    expect(result2.lastUpdatedDate).toBeInstanceOf(Date);
    expect(result2.lastUpdatedDate.getTime()).toBeGreaterThan(0);
    expect(result2.lastAccessedDate).toEqual(result2.lastUpdatedDate);

    log('Successfully handled last dates correctly for multiple items');
  });
});
