import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import {
  setupMockEncryptionAndCompression,
  mockCacheConfig,
  createLogStream,
  createLogger,
} from '../../../jest/default/logging';

describe('TwoLayerClientCache - Cache Config Handling', () => {
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

    logStream = createLogStream('cache-config-handling-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should initialize with default config', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    expect(cache).toBeDefined();
    log('Cache initialized with default config');
  });

  it('should use config values when getting data', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const mockCallback = jest.fn();
    const mockData = {
      identifier: 'testId',
      storeName: 'testStore',
      value: 'testValue',
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    clientStorage.get = jest.fn((id, store, callback) => callback(undefined));
    serverStorage.get = jest.fn().mockResolvedValue(mockData);

    cache.get('testId', 'testStore', mockCallback);

    await new Promise(process.nextTick);

    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
    expect(clientStorage.set).toHaveBeenCalledWith(
      'testId',
      'testStore',
      mockData.value,
      mockData.expirationDate,
    );
    expect(mockCallback).toHaveBeenCalledWith(mockData);
    log('Config values used when getting data');
  });

  it('should use config values when setting data', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    cache.set('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    log('Config values used when setting data');
  });

  it('should handle different cache sizes', () => {
    const smallConfig: CacheConfig = { ...defaultConfig, cacheSize: 10 };
    const largeConfig: CacheConfig = { ...defaultConfig, cacheSize: 1000 };

    const smallCache = new TwoLayerClientCache(smallConfig, clientStorage, serverStorage);
    const largeCache = new TwoLayerClientCache(largeConfig, clientStorage, serverStorage);

    expect(smallCache).toBeDefined();
    expect(largeCache).toBeDefined();

    for (let i = 0; i < 15; i++) {
      const testData: StringValue = { type: 'string', value: `testValue${i}` };
      smallCache.set(`testId${i}`, 'testStore', testData, new Date());
    }

    smallCache.get('testId0', 'testStore', (result) => {
      expect(result).toBeUndefined();
    });
    smallCache.get('testId14', 'testStore', (result) => {
      expect(result).toBeDefined();
    });
    log('Different cache sizes handled');
  });

  it('should handle different cache max ages', async () => {
    const shortAgeConfig: CacheConfig = { ...defaultConfig, cacheMaxAge: 1000 };
    const longAgeConfig: CacheConfig = { ...defaultConfig, cacheMaxAge: 3600000 };

    const shortAgeCache = new TwoLayerClientCache(shortAgeConfig, clientStorage, serverStorage);
    const longAgeCache = new TwoLayerClientCache(longAgeConfig, clientStorage, serverStorage);

    const testData: StringValue = { type: 'string', value: 'testValue' };
    const now = new Date();

    shortAgeCache.set('testId', 'testStore', testData, new Date(now.getTime() + 500));
    longAgeCache.set('testId', 'testStore', testData, new Date(now.getTime() + 1800000));

    await new Promise((resolve) => setTimeout(resolve, 1100));

    shortAgeCache.get('testId', 'testStore', (result) => {
      expect(result).toBeUndefined();
    });

    longAgeCache.get('testId', 'testStore', (result) => {
      expect(result).toBeDefined();
    });
    log('Different cache max ages handled');
  });

  it('should handle different eviction policies', () => {
    const lfuConfig: CacheConfig = { ...defaultConfig, evictionPolicy: 'lfu' };
    const adaptiveConfig: CacheConfig = { ...defaultConfig, evictionPolicy: 'adaptive' };

    const lfuCache = new TwoLayerClientCache(lfuConfig, clientStorage, serverStorage);
    const adaptiveCache = new TwoLayerClientCache(adaptiveConfig, clientStorage, serverStorage);

    expect(lfuCache).toBeDefined();
    expect(adaptiveCache).toBeDefined();

    for (let i = 0; i < 5; i++) {
      lfuCache.get('frequentId', 'testStore', () => {});
      adaptiveCache.get('frequentId', 'testStore', () => {});
    }

    lfuCache.get('rareId', 'testStore', () => {});
    adaptiveCache.get('rareId', 'testStore', () => {});

    lfuCache.get('frequentId', 'testStore', (result) => {
      expect(result).toBeDefined();
    });
    adaptiveCache.get('frequentId', 'testStore', (result) => {
      expect(result).toBeDefined();
    });
    log('Different eviction policies handled');
  });

  it('should respect prefetch threshold', () => {
    const highThresholdConfig: CacheConfig = { ...defaultConfig, prefetchThreshold: 0.9 };
    const lowThresholdConfig: CacheConfig = { ...defaultConfig, prefetchThreshold: 0.1 };

    const highThresholdCache = new TwoLayerClientCache(
      highThresholdConfig,
      clientStorage,
      serverStorage,
    );
    const lowThresholdCache = new TwoLayerClientCache(
      lowThresholdConfig,
      clientStorage,
      serverStorage,
    );

    expect(highThresholdCache).toBeDefined();
    expect(lowThresholdCache).toBeDefined();

    for (let i = 0; i < 50; i++) {
      highThresholdCache.get(`testId${i}`, 'testStore', () => {});
      lowThresholdCache.get(`testId${i}`, 'testStore', () => {});
    }

    expect(serverStorage.get).toHaveBeenCalledTimes(50);
    expect(serverStorage.get).toHaveBeenCalledTimes(100);
    log('Prefetch threshold respected');
  });

  it('should use specified compression level', () => {
    const noCompressionConfig: CacheConfig = { ...defaultConfig, compressionLevel: 0 };
    const highCompressionConfig: CacheConfig = { ...defaultConfig, compressionLevel: 9 };

    const noCompressionCache = new TwoLayerClientCache(
      noCompressionConfig,
      clientStorage,
      serverStorage,
    );
    const highCompressionCache = new TwoLayerClientCache(
      highCompressionConfig,
      clientStorage,
      serverStorage,
    );

    expect(noCompressionCache).toBeDefined();
    expect(highCompressionCache).toBeDefined();

    const testData: StringValue = { type: 'string', value: 'a'.repeat(1000) };

    noCompressionCache.set('testId', 'testStore', testData, new Date());
    highCompressionCache.set('testId', 'testStore', testData, new Date());

    expect(clientStorage.set).toHaveBeenCalledWith(
      'testId',
      'testStore',
      testData,
      expect.any(Date),
    );
    expect(clientStorage.set).toHaveBeenCalledWith(
      'testId',
      'testStore',
      expect.any(Object),
      expect.any(Date),
    );
    log('Specified compression level used');
  });

  it('should handle encryption configuration', () => {
    setupMockEncryptionAndCompression();

    const noEncryptionConfig: CacheConfig = { ...defaultConfig, algorithm: 'none' };
    const aes128Config: CacheConfig = { ...defaultConfig, algorithm: 'aes-128-gcm', keySize: 128 };

    const noEncryptionCache = new TwoLayerClientCache(
      noEncryptionConfig,
      clientStorage,
      serverStorage,
    );
    const aes128Cache = new TwoLayerClientCache(aes128Config, clientStorage, serverStorage);

    expect(noEncryptionCache).toBeDefined();
    expect(aes128Cache).toBeDefined();

    const testData: StringValue = { type: 'string', value: 'testValue' };

    noEncryptionCache.set('testId', 'testStore', testData, new Date());
    aes128Cache.set('testId', 'testStore', testData, new Date());

    expect(serverStorage.set).toHaveBeenCalledWith(
      'testId',
      'testStore',
      testData,
      expect.any(Date),
    );
    expect(serverStorage.set).toHaveBeenCalledWith(
      'testId',
      'testStore',
      expect.any(Object),
      expect.any(Date),
    );
    log('Encryption configuration handled');
  });

  it('should handle batch size configuration', () => {
    const smallBatchConfig: CacheConfig = { ...defaultConfig, batchSize: 5 };
    const largeBatchConfig: CacheConfig = { ...defaultConfig, batchSize: 20 };

    const smallBatchCache = new TwoLayerClientCache(smallBatchConfig, clientStorage, serverStorage);
    const largeBatchCache = new TwoLayerClientCache(largeBatchConfig, clientStorage, serverStorage);

    expect(smallBatchCache).toBeDefined();
    expect(largeBatchCache).toBeDefined();

    for (let i = 0; i < 25; i++) {
      const testData: StringValue = { type: 'string', value: `testValue${i}` };
      smallBatchCache.set(`testId${i}`, 'testStore', testData, new Date());
      largeBatchCache.set(`testId${i}`, 'testStore', testData, new Date());
    }

    expect(serverStorage.set).toHaveBeenCalledTimes(5);
    expect(serverStorage.set).toHaveBeenCalledTimes(2);
    log('Batch size configuration handled');
  });

  it('should respect force reset configuration', () => {
    const forceResetConfig: CacheConfig = { ...defaultConfig, forceReset: true };
    const noResetConfig: CacheConfig = { ...defaultConfig, forceReset: false };

    const forceResetCache = new TwoLayerClientCache(forceResetConfig, clientStorage, serverStorage);
    const noResetCache = new TwoLayerClientCache(noResetConfig, clientStorage, serverStorage);

    expect(forceResetCache).toBeDefined();
    expect(noResetCache).toBeDefined();

    expect(clientStorage.clear).toHaveBeenCalled();
    expect(serverStorage.clear).toHaveBeenCalled();
    expect(clientStorage.clear).not.toHaveBeenCalled();
    expect(serverStorage.clear).not.toHaveBeenCalled();
    log('Force reset configuration respected');
  });
});
