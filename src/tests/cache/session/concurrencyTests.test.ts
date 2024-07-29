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

describe('SessionStorageCache concurrency tests', () => {
  let sessionStorageCache: MockSessionStorageCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('concurrencyTests.log', 'client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting SessionStorageCache concurrency tests...');
  });

  beforeEach(() => {
    sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    log('Test setup complete');
  });

  afterAll(() => {
    jest.clearAllMocks();
    closeLogStreams();
  });

  it('should handle multiple concurrent set operations', async () => {
    log('Starting test: should handle multiple concurrent set operations');
    const operations = 100;
    const promises = [];

    for (let i = 0; i < operations; i++) {
      const testData: DataValue = { type: 'number', value: i };
      const identifier = `test-identifier-${i}`;
      const storeName = 'test-store';

      promises.push(
        new Promise<void>((resolve) => {
          sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
          resolve();
        }),
      );
    }

    await Promise.all(promises);

    const getPromises = [];
    for (let i = 0; i < operations; i++) {
      const identifier = `test-identifier-${i}`;
      const storeName = 'test-store';

      getPromises.push(
        new Promise<void>((resolve) => {
          sessionStorageCache.get(identifier, storeName, (result) => {
            expect(result).toBeDefined();
            expect(result?.value).toEqual({ type: 'number', value: i });
            resolve();
          });
        }),
      );
    }

    await Promise.all(getPromises);

    log('Concurrent set operations test passed');
  });

  it('should handle concurrent set and get operations', async () => {
    log('Starting test: should handle concurrent set and get operations');
    const operations = 100;
    const promises = [];

    for (let i = 0; i < operations; i++) {
      const testData: DataValue = { type: 'number', value: i };
      const identifier = `test-identifier-${i}`;
      const storeName = 'test-store';

      promises.push(
        new Promise<void>((resolve) => {
          sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
          resolve();
        }),
      );
      promises.push(
        new Promise<void>((resolve) => {
          sessionStorageCache.get(identifier, storeName, (result) => {
            expect(result).toBeDefined();
            expect(result?.value).toEqual(testData);
            resolve();
          });
        }),
      );
    }

    await Promise.all(promises);

    log('Concurrent set and get operations test passed');
  });

  it('should handle concurrent set, get, and remove operations', async () => {
    log('Starting test: should handle concurrent set, get, and remove operations');
    const operations = 100;
    const promises = [];

    for (let i = 0; i < operations; i++) {
      const testData: DataValue = { type: 'number', value: i };
      const identifier = `test-identifier-${i}`;
      const storeName = 'test-store';

      promises.push(
        new Promise<void>((resolve) => {
          sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
          resolve();
        }),
      );
      promises.push(
        new Promise<void>((resolve) => {
          sessionStorageCache.get(identifier, storeName, (result) => {
            expect(result).toBeDefined();
            expect(result?.value).toEqual(testData);
            resolve();
          });
        }),
      );
      promises.push(
        new Promise<void>((resolve) => {
          sessionStorageCache.remove(identifier, storeName);
          resolve();
        }),
      );
      promises.push(
        new Promise<void>((resolve) => {
          sessionStorageCache.get(identifier, storeName, (removedResult) => {
            expect(removedResult).toBeUndefined();
            resolve();
          });
        }),
      );
    }

    await Promise.all(promises);

    log('Concurrent set, get, and remove operations test passed');
  });

  it('should handle concurrent updates to the same key', async () => {
    log('Starting test: should handle concurrent updates to the same key');
    const operations = 100;
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const promises = [];

    for (let i = 0; i < operations; i++) {
      const testData: DataValue = { type: 'number', value: i };
      promises.push(
        new Promise<void>((resolve) => {
          sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
          resolve();
        }),
      );
    }

    await Promise.all(promises);

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect((result?.value as { type: string; value: number }).value).toBe(operations - 1);
        resolve();
      });
    });

    log('Concurrent updates to the same key test passed');
  });
});
