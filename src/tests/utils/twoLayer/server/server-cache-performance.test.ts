import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, CacheResult } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Performance', () => {
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

    logStream = createLogStream('server-cache-performance-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  const measurePerformance = async (
    operation: () => Promise<void>,
    iterations: number,
  ): Promise<number> => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await operation();
    }
    const end = performance.now();
    return (end - start) / iterations;
  };

  it('should measure set operation performance', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const averageTime = await measurePerformance(
      () => cache.set('testId', 'testStore', testData, expirationDate),
      1000,
    );

    log(`Average set operation time: ${averageTime.toFixed(3)}ms`);
    expect(averageTime).toBeLessThan(10); // Adjust threshold as needed
  });

  it('should measure get operation performance', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    const measurePerformance = async (
      operation: () => Promise<CacheResult | undefined>,
      iterations: number,
    ): Promise<number> => {
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await operation();
      }
      const end = performance.now();
      return (end - start) / iterations;
    };

    const averageTime = await measurePerformance(() => cache.get('testId', 'testStore'), 1000);

    log(`Average get operation time: ${averageTime.toFixed(3)}ms`);
    expect(averageTime).toBeLessThan(5); // Adjust threshold as needed
  });

  it('should measure remove operation performance', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    const averageTime = await measurePerformance(() => cache.remove('testId', 'testStore'), 1000);

    log(`Average remove operation time: ${averageTime.toFixed(3)}ms`);
    expect(averageTime).toBeLessThan(5); // Adjust threshold as needed
  });

  it('should measure clear operation performance', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    const averageTime = await measurePerformance(() => cache.clear(), 100);

    log(`Average clear operation time: ${averageTime.toFixed(3)}ms`);
    expect(averageTime).toBeLessThan(20); // Adjust threshold as needed
  });

  it('should measure subscription performance', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const listener = jest.fn();

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      cache.subscribeToUpdates(`testId${i}`, 'testStore', listener);
    }
    const end = performance.now();
    const averageTime = (end - start) / 1000;

    log(`Average subscription time: ${averageTime.toFixed(3)}ms`);
    expect(averageTime).toBeLessThan(1); // Adjust threshold as needed
  });

  it('should measure performance with increasing data size', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const expirationDate = new Date(Date.now() + 1000);

    const dataSizes = [100, 1000, 10000, 100000];

    const measurePerformance = async <T>(
      operation: () => Promise<T>,
      iterations: number,
    ): Promise<number> => {
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await operation();
      }
      const end = performance.now();
      return (end - start) / iterations;
    };

    for (const size of dataSizes) {
      const testData: StringValue = { type: 'string', value: 'a'.repeat(size) };

      const setTime = await measurePerformance(
        () => cache.set('testId', 'testStore', testData, expirationDate),
        100,
      );

      const getTime = await measurePerformance(() => cache.get('testId', 'testStore'), 100);

      log(`Data size: ${size} bytes`);
      log(`Average set time: ${setTime.toFixed(3)}ms`);
      log(`Average get time: ${getTime.toFixed(3)}ms`);

      expect(setTime).toBeLessThan(50); // Adjust threshold as needed
      expect(getTime).toBeLessThan(20); // Adjust threshold as needed
    }
  });

  it('should measure performance under concurrent operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const concurrentOperations = 100;
    const iterations = 10;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await Promise.all([
        ...Array(concurrentOperations)
          .fill(null)
          .map(() => cache.set(`testId${Math.random()}`, 'testStore', testData, expirationDate)),
        ...Array(concurrentOperations)
          .fill(null)
          .map(() => cache.get(`testId${Math.random()}`, 'testStore')),
        ...Array(concurrentOperations)
          .fill(null)
          .map(() => cache.remove(`testId${Math.random()}`, 'testStore')),
      ]);
    }
    const end = performance.now();

    const averageTime = (end - start) / (iterations * concurrentOperations * 3);
    log(`Average time per operation under concurrent load: ${averageTime.toFixed(3)}ms`);
    expect(averageTime).toBeLessThan(10); // Adjust threshold as needed
  });
});
