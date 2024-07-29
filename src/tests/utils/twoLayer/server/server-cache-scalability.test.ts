import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Scalability', () => {
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    serverStorage = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
      subscribeToUpdates: jest.fn(),
    };

    defaultConfig = mockCacheConfig;

    logStream = createLogStream('server-cache-scalability-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle increasing number of cache entries', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const entryCounts = [100, 1000, 10000, 100000];
    const expirationDate = new Date(Date.now() + 1000);

    for (const count of entryCounts) {
      const start = performance.now();

      for (let i = 0; i < count; i++) {
        const testData: StringValue = { type: 'string', value: `testValue${i}` };
        await cache.set(`testId${i}`, 'testStore', testData, expirationDate);
      }

      const end = performance.now();
      const averageSetTime = (end - start) / count;

      log(`Entries: ${count}, Average set time: ${averageSetTime.toFixed(3)}ms`);
      expect(averageSetTime).toBeLessThan(10); // Adjust threshold as needed
    }
  });

  it('should maintain performance with increasing data size', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const dataSizes = [100, 1000, 10000, 100000];
    const expirationDate = new Date(Date.now() + 1000);

    for (const size of dataSizes) {
      const testData: StringValue = { type: 'string', value: 'a'.repeat(size) };

      const setStart = performance.now();
      await cache.set('testId', 'testStore', testData, expirationDate);
      const setEnd = performance.now();

      const getStart = performance.now();
      await cache.get('testId', 'testStore');
      const getEnd = performance.now();

      const setTime = setEnd - setStart;
      const getTime = getEnd - getStart;

      log(
        `Data size: ${size} bytes, Set time: ${setTime.toFixed(3)}ms, Get time: ${getTime.toFixed(3)}ms`,
      );
      expect(setTime).toBeLessThan(50); // Adjust threshold as needed
      expect(getTime).toBeLessThan(20); // Adjust threshold as needed
    }
  });

  it('should handle concurrent operations at scale', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const concurrentOperations = [100, 1000, 10000];
    const expirationDate = new Date(Date.now() + 1000);

    for (const opCount of concurrentOperations) {
      const start = performance.now();

      await Promise.all(
        Array(opCount)
          .fill(null)
          .map((_, index) => {
            const testData: StringValue = { type: 'string', value: `testValue${index}` };
            return cache.set(`testId${index}`, 'testStore', testData, expirationDate);
          }),
      );

      const end = performance.now();
      const totalTime = end - start;
      const averageTime = totalTime / opCount;

      log(
        `Concurrent operations: ${opCount}, Total time: ${totalTime.toFixed(3)}ms, Average time: ${averageTime.toFixed(3)}ms`,
      );
      expect(averageTime).toBeLessThan(5); // Adjust threshold as needed
    }
  });

  it('should maintain performance with increasing number of stores', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const storeCounts = [10, 100, 1000];
    const expirationDate = new Date(Date.now() + 1000);

    for (const storeCount of storeCounts) {
      const start = performance.now();

      for (let i = 0; i < storeCount; i++) {
        const testData: StringValue = { type: 'string', value: `testValue${i}` };
        await cache.set(`testId${i}`, `testStore${i}`, testData, expirationDate);
      }

      const end = performance.now();
      const totalTime = end - start;
      const averageTime = totalTime / storeCount;

      log(
        `Store count: ${storeCount}, Total time: ${totalTime.toFixed(3)}ms, Average time: ${averageTime.toFixed(3)}ms`,
      );
      expect(averageTime).toBeLessThan(5); // Adjust threshold as needed
    }
  });

  it('should handle rapid successive operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const operationCounts = [100, 1000, 10000];
    const expirationDate = new Date(Date.now() + 1000);

    for (const count of operationCounts) {
      const start = performance.now();

      for (let i = 0; i < count; i++) {
        const testData: StringValue = { type: 'string', value: `testValue${i}` };
        await cache.set(`testId${i}`, 'testStore', testData, expirationDate);
        await cache.get(`testId${i}`, 'testStore');
        await cache.remove(`testId${i}`, 'testStore');
      }

      const end = performance.now();
      const totalTime = end - start;
      const averageTime = totalTime / (count * 3); // 3 operations per iteration

      log(
        `Rapid operations: ${count * 3}, Total time: ${totalTime.toFixed(3)}ms, Average time: ${averageTime.toFixed(3)}ms`,
      );
      expect(averageTime).toBeLessThan(10); // Adjust threshold as needed
    }
  });
});
