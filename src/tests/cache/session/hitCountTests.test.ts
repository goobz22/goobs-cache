import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals';
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

describe('SessionStorageCache hit count tests', () => {
  let sessionStorageCache: MockSessionStorageCache;
  let log: (message: string) => void = () => {};

  beforeEach(async () => {
    jest.useFakeTimers();
    const logFunction = await runTestsWithLogging('hitCountTests.log', 'client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    log('Test setup complete');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    closeLogStreams();
  });

  it('should increment set hit count on set operation', async () => {
    log('Starting test: should increment set hit count on set operation');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.setHitCount).toBe(1);
        resolve();
      });
    });

    log('Set hit count increment test passed');
  });

  it('should increment get hit count on get operation', async () => {
    log('Starting test: should increment get hit count on get operation');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, () => {});
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.getHitCount).toBe(2);
        resolve();
      });
    });

    log('Get hit count increment test passed');
  });

  it('should maintain separate hit counts for different identifiers', async () => {
    log('Starting test: should maintain separate hit counts for different identifiers');
    const identifier1 = 'test-identifier-1';
    const identifier2 = 'test-identifier-2';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    sessionStorageCache.set(identifier1, storeName, testData, new Date(Date.now() + 3600000));
    sessionStorageCache.set(identifier2, storeName, testData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier1, storeName, () => {});
      sessionStorageCache.get(identifier1, storeName, (result1) => {
        expect(result1).toBeDefined();
        expect(result1?.setHitCount).toBe(1);
        expect(result1?.getHitCount).toBe(2);
      });

      sessionStorageCache.get(identifier2, storeName, (result2) => {
        expect(result2).toBeDefined();
        expect(result2?.setHitCount).toBe(1);
        expect(result2?.getHitCount).toBe(1);
        resolve();
      });
    });

    log('Separate hit counts for different identifiers test passed');
  });

  it('should reset hit counts when item is removed and re-added', async () => {
    log('Starting test: should reset hit counts when item is removed and re-added');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
    sessionStorageCache.get(identifier, storeName, () => {});

    sessionStorageCache.remove(identifier, storeName);

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.setHitCount).toBe(1);
        expect(result?.getHitCount).toBe(1);
        resolve();
      });
    });

    log('Hit count reset on remove and re-add test passed');
  });
});
