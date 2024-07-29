import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';
import SessionStorageCache from '../../../cache/session.client';
import { DataValue } from '../../../types';

const logStream = createLogStream('multipleSetGetOperationsTests.log');
const log = createLogger(logStream);

describe('SessionStorageCache multiple set and get operations tests', () => {
  let sessionStorageCache: SessionStorageCache;

  beforeEach(() => {
    setMockedGlobals();
    sessionStorageCache = new SessionStorageCache(mockCacheConfig);
    setupErrorHandling(log, logStream);
  });

  afterEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it('should handle multiple set operations for different identifiers', async () => {
    const storeName = 'test-store';
    const testData: DataValue[] = [
      { type: 'string', value: 'value1' },
      { type: 'number', value: 42 },
      { type: 'boolean', value: true },
    ];

    const setPromises = testData.map(
      (data, index) =>
        new Promise<void>((resolve) => {
          sessionStorageCache.set(
            `identifier-${index}`,
            storeName,
            data,
            new Date(Date.now() + 3600000),
          );
          resolve();
        }),
    );

    await Promise.all(setPromises);

    for (let i = 0; i < testData.length; i++) {
      await new Promise<void>((resolve) => {
        sessionStorageCache.get(`identifier-${i}`, storeName, (result) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(testData[i]);
          resolve();
        });
      });
    }

    log('Multiple set operations for different identifiers test passed');
  });

  it('should handle multiple get operations for the same identifier', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    const getPromises = Array(5)
      .fill(null)
      .map(
        () =>
          new Promise<void>((resolve) => {
            sessionStorageCache.get(identifier, storeName, (result) => {
              expect(result).toBeDefined();
              expect(result?.value).toEqual(testData);
              resolve();
            });
          }),
      );

    await Promise.all(getPromises);

    log('Multiple get operations for the same identifier test passed');
  });

  it('should handle interleaved set and get operations', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue[] = [
      { type: 'string', value: 'value1' },
      { type: 'number', value: 42 },
      { type: 'boolean', value: true },
    ];

    const operations = testData.flatMap((data) => [
      new Promise<void>((resolve) => {
        sessionStorageCache.set(identifier, storeName, data, new Date(Date.now() + 3600000));
        resolve();
      }),
      new Promise<void>((resolve) => {
        sessionStorageCache.get(identifier, storeName, (result) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(data);
          resolve();
        });
      }),
    ]);

    await Promise.all(operations);

    log('Interleaved set and get operations test passed');
  });

  it('should handle multiple set operations overwriting the same identifier', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue[] = [
      { type: 'string', value: 'value1' },
      { type: 'number', value: 42 },
      { type: 'boolean', value: true },
    ];

    for (const data of testData) {
      await new Promise<void>((resolve) => {
        sessionStorageCache.set(identifier, storeName, data, new Date(Date.now() + 3600000));
        resolve();
      });
    }

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData[testData.length - 1]);
        resolve();
      });
    });

    log('Multiple set operations overwriting the same identifier test passed');
  });

  it('should handle concurrent set and get operations', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';

    log('Starting concurrent set and get operations test');

    const results: Array<{ index: number; value: number | null }> = [];

    const operations = Array(100)
      .fill(null)
      .map(
        (_, index) =>
          new Promise<void>((resolve) => {
            if (index % 2 === 0) {
              sessionStorageCache.set(
                identifier,
                storeName,
                { type: 'number', value: index },
                new Date(Date.now() + 3600000),
              );
              results.push({ index, value: index });
              log(`Set operation ${index} completed`);
            } else {
              sessionStorageCache.get(identifier, storeName, (result) => {
                const value = result
                  ? (result.value as { type: string; value: number }).value
                  : null;
                results.push({ index, value });
                log(`Get operation ${index} completed, value: ${value}`);
              });
            }
            resolve();
          }),
      );

    await Promise.all(operations);
    log('All concurrent operations completed');

    results.forEach(({ value }) => {
      expect(value).toEqual(expect.anything());
      expect(typeof value).toMatch(/^(number|object)$/);
      expect(value).toEqual(expect.anything());
      expect(value).toEqual(expect.anything());
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        const value = result!.value as { type: string; value: number };
        expect(value.type).toBe('number');
        expect(value.value).toBe(98);
        log(`Final get operation completed, final value: ${value.value}`);
        resolve();
      });
    });

    log('Concurrent set and get operations test passed');
  });
});
