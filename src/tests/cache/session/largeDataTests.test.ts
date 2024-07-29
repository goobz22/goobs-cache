import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import {
  MockSessionStorageCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/session.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { DataValue } from '../../../types';

describe('SessionStorageCache large data tests', () => {
  let sessionStorageCache: MockSessionStorageCache;
  let log: (message: string) => void = () => {};

  beforeEach(async () => {
    sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    const logFunction = await runTestsWithLogging('largeDataTests.log', 'client');
    log = await logFunction(0, 0, 0);
  });

  afterEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    closeLogStreams();
  });

  it('should handle setting and getting large string data', async () => {
    log('Starting test: should handle setting and getting large string data');
    const identifier = 'large-string-identifier';
    const storeName = 'large-data-store';
    const largeString = 'a'.repeat(1000000);
    const testData: DataValue = { type: 'string', value: largeString };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Large string data test passed');
        resolve();
      });
    });
  });

  it('should handle setting and getting large object data', async () => {
    log('Starting test: should handle setting and getting large object data');
    const identifier = 'large-object-identifier';
    const storeName = 'large-data-store';
    const largeObject: Record<string, number> = {};
    for (let i = 0; i < 10000; i++) {
      largeObject[`key${i}`] = i;
    }
    const testData: DataValue = { type: 'json', value: largeObject };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Large object data test passed');
        resolve();
      });
    });
  });

  it('should handle setting and getting large array data', async () => {
    log('Starting test: should handle setting and getting large array data');
    const identifier = 'large-array-identifier';
    const storeName = 'large-data-store';
    const largeArray = Array.from({ length: 100000 }, (_, i) => i);
    const testData: DataValue = { type: 'json', value: largeArray };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Large array data test passed');
        resolve();
      });
    });
  });

  it('should handle setting and getting multiple large data items', async () => {
    log('Starting test: should handle setting and getting multiple large data items');
    const storeName = 'large-data-store';
    const items = [
      {
        identifier: 'large-string',
        data: { type: 'string', value: 'a'.repeat(500000) } as DataValue,
      },
      {
        identifier: 'large-object',
        data: {
          type: 'json',
          value: Array.from({ length: 50000 }, (_, i) => ({ [`key${i}`]: i })),
        } as DataValue,
      },
      {
        identifier: 'large-array',
        data: { type: 'json', value: Array.from({ length: 50000 }, (_, i) => i) } as DataValue,
      },
    ];

    await Promise.all(
      items.map(
        (item) =>
          new Promise<void>((resolve) => {
            sessionStorageCache.set(
              item.identifier,
              storeName,
              item.data,
              new Date(Date.now() + 3600000),
            );
            resolve();
          }),
      ),
    );

    await Promise.all(
      items.map(
        (item) =>
          new Promise<void>((resolve) => {
            sessionStorageCache.get(item.identifier, storeName, (result) => {
              expect(result).toBeDefined();
              expect(result?.value).toEqual(item.data);
              resolve();
            });
          }),
      ),
    );

    log('Multiple large data items test passed');
  });
});
