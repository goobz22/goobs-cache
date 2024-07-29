import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - Performance', () => {
  let clientStorage: ClientStorage;
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    clientStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    };

    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    defaultConfig = mockCacheConfig;

    logStream = createLogStream('cache-performance-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should perform multiple set operations within a reasonable time', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    const start = Date.now();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      await cache.set(`testId${i}`, 'testStore', testData, expirationDate);
    }

    const end = Date.now();
    const duration = end - start;

    expect(duration).toBeLessThan(5000); // Assuming 5 seconds is a reasonable time for 1000 operations
    expect(clientStorage.set).toHaveBeenCalledTimes(iterations);
    expect(serverStorage.set).toHaveBeenCalledTimes(iterations);

    log(`Performed ${iterations} set operations in ${duration}ms`);
  });

  it('should perform multiple get operations within a reasonable time', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    clientStorage.get = jest.fn(
      (id: string, store: string, callback: (result: unknown) => void) => {
        callback({
          identifier: id,
          storeName: store,
          value: testData,
          expirationDate,
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
          getHitCount: 1,
          setHitCount: 1,
        });
      },
    );

    const start = Date.now();
    const iterations = 1000;
    const promises: Promise<void>[] = [];

    for (let i = 0; i < iterations; i++) {
      promises.push(
        new Promise<void>((resolve) => {
          cache.get(`testId${i}`, 'testStore', () => {
            resolve();
          });
        }),
      );
    }

    await Promise.all(promises);

    const end = Date.now();
    const duration = end - start;

    expect(duration).toBeLessThan(5000); // Assuming 5 seconds is a reasonable time for 1000 operations
    expect(clientStorage.get).toHaveBeenCalledTimes(iterations);

    log(`Performed ${iterations} get operations in ${duration}ms`);
  });

  it('should perform multiple remove operations within a reasonable time', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);

    const start = Date.now();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      await cache.remove(`testId${i}`, 'testStore');
    }

    const end = Date.now();
    const duration = end - start;

    expect(duration).toBeLessThan(5000); // Assuming 5 seconds is a reasonable time for 1000 operations
    expect(clientStorage.remove).toHaveBeenCalledTimes(iterations);
    expect(serverStorage.remove).toHaveBeenCalledTimes(iterations);

    log(`Performed ${iterations} remove operations in ${duration}ms`);
  });

  it('should handle a mix of operations within a reasonable time', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    clientStorage.get = jest.fn(
      (id: string, store: string, callback: (result: unknown) => void) => {
        callback({
          identifier: id,
          storeName: store,
          value: testData,
          expirationDate,
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
          getHitCount: 1,
          setHitCount: 1,
        });
      },
    );

    const start = Date.now();
    const iterations = 1000;
    const promises: Promise<void>[] = [];

    for (let i = 0; i < iterations; i++) {
      if (i % 3 === 0) {
        promises.push(
          new Promise<void>((resolve) => {
            cache.set(`testId${i}`, 'testStore', testData, expirationDate);
            resolve();
          }),
        );
      } else if (i % 3 === 1) {
        promises.push(
          new Promise<void>((resolve) => {
            cache.get(`testId${i}`, 'testStore', () => {
              resolve();
            });
          }),
        );
      } else {
        promises.push(
          new Promise<void>((resolve) => {
            cache.remove(`testId${i}`, 'testStore');
            resolve();
          }),
        );
      }
    }

    await Promise.all(promises);

    const end = Date.now();
    const duration = end - start;

    expect(duration).toBeLessThan(5000); // Assuming 5 seconds is a reasonable time for 1000 mixed operations
    expect(clientStorage.set).toHaveBeenCalledTimes(Math.floor(iterations / 3));
    expect(clientStorage.get).toHaveBeenCalledTimes(Math.floor(iterations / 3));
    expect(clientStorage.remove).toHaveBeenCalledTimes(Math.floor(iterations / 3));

    log(`Performed ${iterations} mixed operations in ${duration}ms`);
  });
});
