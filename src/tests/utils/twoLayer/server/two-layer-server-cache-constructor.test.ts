import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Constructor', () => {
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    defaultConfig = mockCacheConfig;

    logStream = createLogStream('two-layer-server-cache-constructor-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should create an instance with valid config and server storage', () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    expect(cache).toBeInstanceOf(TwoLayerServerCache);
    log('TwoLayerServerCache instance created successfully');
  });

  it('should throw an error with invalid cache size', () => {
    const invalidConfig = { ...defaultConfig, cacheSize: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid cache size',
    );
    log('Error thrown for invalid cache size');
  });

  it('should throw an error with invalid cache max age', () => {
    const invalidConfig = { ...defaultConfig, cacheMaxAge: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid cache max age',
    );
    log('Error thrown for invalid cache max age');
  });

  it('should throw an error with invalid persistence interval', () => {
    const invalidConfig = { ...defaultConfig, persistenceInterval: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid persistence interval',
    );
    log('Error thrown for invalid persistence interval');
  });

  it('should throw an error with invalid max memory usage', () => {
    const invalidConfig = { ...defaultConfig, maxMemoryUsage: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid max memory usage',
    );
    log('Error thrown for invalid max memory usage');
  });

  it('should throw an error with invalid eviction policy', () => {
    const invalidConfig = {
      ...defaultConfig,
      evictionPolicy: 'invalid' as 'lru' | 'lfu' | 'adaptive',
    };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid eviction policy',
    );
    log('Error thrown for invalid eviction policy');
  });

  it('should throw an error with invalid prefetch threshold', () => {
    const invalidConfig = { ...defaultConfig, prefetchThreshold: -0.1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid prefetch threshold',
    );
    log('Error thrown for invalid prefetch threshold');
  });

  it('should throw an error with invalid compression level', () => {
    const invalidConfig = { ...defaultConfig, compressionLevel: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid compression level',
    );
    log('Error thrown for invalid compression level');
  });

  it('should throw an error with invalid encryption algorithm', () => {
    const invalidConfig = { ...defaultConfig, algorithm: 'invalid' };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid encryption algorithm',
    );
    log('Error thrown for invalid encryption algorithm');
  });

  it('should throw an error with invalid key size', () => {
    const invalidConfig = { ...defaultConfig, keySize: 123 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow('Invalid key size');
    log('Error thrown for invalid key size');
  });

  it('should throw an error with invalid batch size', () => {
    const invalidConfig = { ...defaultConfig, batchSize: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid batch size',
    );
    log('Error thrown for invalid batch size');
  });

  it('should throw an error with invalid auto-tune interval', () => {
    const invalidConfig = { ...defaultConfig, autoTuneInterval: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid auto-tune interval',
    );
    log('Error thrown for invalid auto-tune interval');
  });

  it('should throw an error with invalid key check interval', () => {
    const invalidConfig = { ...defaultConfig, keyCheckIntervalMs: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid key check interval',
    );
    log('Error thrown for invalid key check interval');
  });

  it('should throw an error with invalid key rotation interval', () => {
    const invalidConfig = { ...defaultConfig, keyRotationIntervalMs: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid key rotation interval',
    );
    log('Error thrown for invalid key rotation interval');
  });

  it('should throw an error with missing server storage', () => {
    expect(() => new TwoLayerServerCache(defaultConfig, null!)).toThrow('Invalid server storage');
    log('Error thrown for missing server storage');
  });

  it('should create an instance with minimum valid config', () => {
    const minConfig: CacheConfig = {
      cacheSize: 1,
      cacheMaxAge: 1,
      persistenceInterval: 1,
      maxMemoryUsage: 1,
      evictionPolicy: 'lru',
      prefetchThreshold: 0,
      compressionLevel: 0,
      algorithm: 'aes-256-gcm',
      keySize: 256,
      batchSize: 1,
      autoTuneInterval: 1,
      keyCheckIntervalMs: 1,
      keyRotationIntervalMs: 1,
      forceReset: false,
      encryptionPassword: 'password',
    };
    const cache = new TwoLayerServerCache(minConfig, serverStorage);
    expect(cache).toBeInstanceOf(TwoLayerServerCache);
    log('TwoLayerServerCache instance created with minimum valid config');
  });
});
