import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';
import SessionStorageCache from '../../../cache/session.client';
import { DataValue } from '../../../types';

const logStream = createLogStream('performanceTests.log');
const log = createLogger(logStream);

describe('SessionStorageCache performance tests', () => {
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

  const measureTime = async (operation: () => Promise<void>): Promise<number> => {
    const start = performance.now();
    await operation();
    return performance.now() - start;
  };

  it('should set and get small data within 10ms', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    const setTime = await measureTime(async () => {
      await new Promise<void>((resolve) => {
        sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
        resolve();
      });
    });

    const getTime = await measureTime(async () => {
      await new Promise<void>((resolve) => {
        sessionStorageCache.get(identifier, storeName, (result) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(testData);
          resolve();
        });
      });
    });

    expect(setTime).toBeLessThan(10);
    expect(getTime).toBeLessThan(10);

    log(`Set time: ${setTime.toFixed(2)}ms, Get time: ${getTime.toFixed(2)}ms`);
  });

  it('should handle 1000 set operations within 1000ms', async () => {
    const operations = 1000;
    const storeName = 'test-store';

    const totalTime = await measureTime(async () => {
      const promises: Promise<void>[] = [];
      for (let i = 0; i < operations; i++) {
        const identifier = `test-identifier-${i}`;
        const testData: DataValue = { type: 'number', value: i };
        promises.push(
          new Promise<void>((resolve) => {
            sessionStorageCache.set(
              identifier,
              storeName,
              testData,
              new Date(Date.now() + 3600000),
            );
            resolve();
          }),
        );
      }
      await Promise.all(promises);
    });

    expect(totalTime).toBeLessThan(1000);

    log(`Time for ${operations} set operations: ${totalTime.toFixed(2)}ms`);
  });

  it('should handle 1000 get operations within 1000ms', async () => {
    const operations = 1000;
    const storeName = 'test-store';

    // Prepare data
    for (let i = 0; i < operations; i++) {
      const identifier = `test-identifier-${i}`;
      const testData: DataValue = { type: 'number', value: i };
      await new Promise<void>((resolve) => {
        sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
        resolve();
      });
    }

    const totalTime = await measureTime(async () => {
      const promises: Promise<void>[] = [];
      for (let i = 0; i < operations; i++) {
        const identifier = `test-identifier-${i}`;
        promises.push(
          new Promise<void>((resolve) => {
            sessionStorageCache.get(identifier, storeName, (result) => {
              expect(result).toBeDefined();
              expect((result?.value as { type: string; value: number }).value).toBe(i);
              resolve();
            });
          }),
        );
      }
      await Promise.all(promises);
    });

    expect(totalTime).toBeLessThan(1000);

    log(`Time for ${operations} get operations: ${totalTime.toFixed(2)}ms`);
  });

  it('should handle large data (1MB) set and get within 100ms', async () => {
    const identifier = 'large-data-identifier';
    const storeName = 'large-data-store';
    const largeData: DataValue = { type: 'string', value: 'x'.repeat(1024 * 1024) }; // 1MB of data

    const setTime = await measureTime(async () => {
      await new Promise<void>((resolve) => {
        sessionStorageCache.set(identifier, storeName, largeData, new Date(Date.now() + 3600000));
        resolve();
      });
    });

    const getTime = await measureTime(async () => {
      await new Promise<void>((resolve) => {
        sessionStorageCache.get(identifier, storeName, (result) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(largeData);
          resolve();
        });
      });
    });

    expect(setTime).toBeLessThan(100);
    expect(getTime).toBeLessThan(100);

    log(`Large data set time: ${setTime.toFixed(2)}ms, get time: ${getTime.toFixed(2)}ms`);
  });
});
