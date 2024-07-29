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

describe('ServerCache Expiration Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('expiration-tests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Expiration tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    jest.useFakeTimers(); // Enable fake timers for simulating time passing
    log('Test setup complete');
  });

  afterEach(() => {
    jest.useRealTimers(); // Restore real timers after each test
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should expire items after the specified expiration time', async () => {
    log('Starting test: should expire items after the specified expiration time');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };
    const expirationTime = 1000; // 1 second

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + expirationTime));

    // Simulate time passing
    jest.advanceTimersByTime(expirationTime + 100);

    const result = await serverCache.get(identifier, storeName);
    expect(result.value).toBeUndefined();
    log('Successfully expired item after the specified expiration time');
  });

  it('should not return expired items', async () => {
    log('Starting test: should not return expired items');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };
    const expirationTime = 1000; // 1 second

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + expirationTime));

    // Simulate time passing
    jest.advanceTimersByTime(expirationTime + 100);

    const result = await serverCache.get(identifier, storeName);
    expect(result.value).toBeUndefined();
    log('Successfully prevented returning expired items');
  });

  it('should update the expiration time when setting an existing item', async () => {
    log('Starting test: should update the expiration time when setting an existing item');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };
    const expirationTime1 = 1000; // 1 second
    const expirationTime2 = 2000; // 2 seconds

    await serverCache.set(identifier, storeName, value1, new Date(Date.now() + expirationTime1));
    await serverCache.set(identifier, storeName, value2, new Date(Date.now() + expirationTime2));

    // Simulate time passing
    jest.advanceTimersByTime(expirationTime1 + 100);

    const result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(value2);
    log('Successfully updated the expiration time when setting an existing item');
  });

  it('should handle expired items gracefully', async () => {
    log('Starting test: should handle expired items gracefully');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };
    const expirationTime = -1000; // Expired 1 second ago

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + expirationTime));

    const result = await serverCache.get(identifier, storeName);
    expect(result.value).toBeUndefined();
    log('Successfully handled expired items gracefully');
  });
});
