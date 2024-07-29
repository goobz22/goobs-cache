import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, EvictionPolicy } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Config Handling', () => {
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
  let logStream: fs.WriteStream;

  beforeEach(() => {
    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    defaultConfig = mockCacheConfig;

    logStream = createLogStream('server-cache-config-handling-test.log');
    createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should create cache with valid config', () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    expect(cache).toBeInstanceOf(TwoLayerServerCache);
  });

  it('should throw error for invalid cache size', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, cacheSize: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid cache size',
    );
  });

  it('should throw error for invalid cache max age', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, cacheMaxAge: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid cache max age',
    );
  });

  it('should throw error for invalid persistence interval', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, persistenceInterval: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid persistence interval',
    );
  });

  it('should throw error for invalid max memory usage', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, maxMemoryUsage: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid max memory usage',
    );
  });

  it('should throw error for invalid eviction policy', () => {
    const invalidConfig: CacheConfig = {
      ...defaultConfig,
      evictionPolicy: 'invalid' as EvictionPolicy,
    };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid eviction policy',
    );
  });

  it('should throw error for invalid prefetch threshold', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, prefetchThreshold: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid prefetch threshold',
    );
  });

  it('should throw error for invalid compression level', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, compressionLevel: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid compression level',
    );
  });

  it('should throw error for invalid encryption algorithm', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, algorithm: 'invalid' };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid encryption algorithm',
    );
  });

  it('should throw error for invalid key size', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, keySize: 123 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow('Invalid key size');
  });

  it('should throw error for invalid batch size', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, batchSize: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid batch size',
    );
  });

  it('should throw error for invalid auto-tune interval', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, autoTuneInterval: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid auto-tune interval',
    );
  });

  it('should throw error for invalid key check interval', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, keyCheckIntervalMs: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid key check interval',
    );
  });

  it('should throw error for invalid key rotation interval', () => {
    const invalidConfig: CacheConfig = { ...defaultConfig, keyRotationIntervalMs: -1 };
    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid key rotation interval',
    );
  });
});
