import { jest, describe, it, beforeAll, beforeEach, afterAll, expect } from '@jest/globals';
import {
  MockSessionStorageCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/session.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { DataValue } from '../../../types';

jest.mock('../../../jest/mocks/cache/client/session.mock');
jest.mock('../../../jest/reusableJest/logging');
jest.mock('../../../jest/reusableJest/errorHandling');

describe('SessionStorageCache expiration tests', () => {
  let sessionStorageCache: MockSessionStorageCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('expirationTests.log', 'client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting SessionStorageCache expiration tests...');
  });

  beforeEach(() => {
    jest.useFakeTimers();
    sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    log('Test setup complete');
  });

  afterAll(() => {
    jest.useRealTimers();
    closeLogStreams();
  });

  it('should return undefined for expired items', async () => {
    log('Starting test: should return undefined for expired items');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 1000));
    jest.advanceTimersByTime(1001);

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeUndefined();
        resolve();
      });
    });

    log('Expired item test passed');
  });

  it('should return valid items before expiration', async () => {
    log('Starting test: should return valid items before expiration');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 1000));
    jest.advanceTimersByTime(999);

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Valid item before expiration test passed');
  });

  it('should handle items with different expiration times', async () => {
    log('Starting test: should handle items with different expiration times');
    const storeName = 'test-store';
    const testData1: DataValue = { type: 'string', value: 'test value 1' };
    const testData2: DataValue = { type: 'string', value: 'test value 2' };

    sessionStorageCache.set('identifier1', storeName, testData1, new Date(Date.now() + 1000));
    sessionStorageCache.set('identifier2', storeName, testData2, new Date(Date.now() + 2000));
    jest.advanceTimersByTime(1500);

    await new Promise<void>((resolve) => {
      sessionStorageCache.get('identifier1', storeName, (result) => {
        expect(result).toBeUndefined();
      });
      sessionStorageCache.get('identifier2', storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData2);
        resolve();
      });
    });

    log('Different expiration times test passed');
  });

  it('should allow updating expiration time', async () => {
    log('Starting test: should allow updating expiration time');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 1000));
    jest.advanceTimersByTime(500);
    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 1000));
    jest.advanceTimersByTime(800);

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Update expiration time test passed');
  });

  it('should handle expiration of all items', async () => {
    log('Starting test: should handle expiration of all items');
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    sessionStorageCache.set('identifier1', storeName, testData, new Date(Date.now() + 1000));
    sessionStorageCache.set('identifier2', storeName, testData, new Date(Date.now() + 1000));
    jest.advanceTimersByTime(1001);

    await new Promise<void>((resolve) => {
      sessionStorageCache.get('identifier1', storeName, (result) => {
        expect(result).toBeUndefined();
      });
      sessionStorageCache.get('identifier2', storeName, (result) => {
        expect(result).toBeUndefined();
        resolve();
      });
    });

    log('All items expiration test passed');
  });
});
