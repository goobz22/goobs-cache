import { loadConfig } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheConfig, EvictionPolicy } from '../../../types';
import { WriteStream } from 'fs';
import path from 'path';
import fs from 'fs/promises';

jest.mock('fs/promises');
jest.mock('../../../ReusableStore.server', () => ({
  loadConfig: jest.requireActual('../../../ReusableStore.server').loadConfig,
}));

const logStream: WriteStream = createLogStream('load-config-success-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Load Config Success Tests', () => {
  beforeAll(() => {
    log('Starting Load Config Success tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully load a valid configuration file', async () => {
    const mockConfig: CacheConfig = {
      cacheSize: 100,
      cacheMaxAge: 3600000,
      persistenceInterval: 5000,
      maxMemoryUsage: 1024 * 1024,
      evictionPolicy: 'lru',
      prefetchThreshold: 0.8,
      compressionLevel: 1,
      algorithm: 'aes-256-gcm',
      keySize: 256,
      batchSize: 10,
      autoTuneInterval: 3600000,
      keyCheckIntervalMs: 3600000,
      keyRotationIntervalMs: 86400000,
      forceReset: false,
      encryptionPassword: 'testPassword',
    };

    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

    const config = await loadConfig();

    expect(fs.readFile).toHaveBeenCalledWith(
      path.resolve(process.cwd(), '.reusablestore.json'),
      'utf-8',
    );
    expect(config).toEqual(mockConfig);

    log('Successfully loaded a valid configuration file');
  });

  it('should load configuration with custom values', async () => {
    const mockConfig: CacheConfig = {
      cacheSize: 500,
      cacheMaxAge: 7200000,
      persistenceInterval: 10000,
      maxMemoryUsage: 2 * 1024 * 1024,
      evictionPolicy: 'lfu',
      prefetchThreshold: 0.5,
      compressionLevel: 2,
      algorithm: 'aes-128-gcm',
      keySize: 128,
      batchSize: 20,
      autoTuneInterval: 7200000,
      keyCheckIntervalMs: 1800000,
      keyRotationIntervalMs: 43200000,
      forceReset: true,
      encryptionPassword: 'customPassword',
    };

    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

    const config = await loadConfig();

    expect(config).toEqual(mockConfig);
    expect(config.cacheSize).toBe(500);
    expect(config.evictionPolicy).toBe('lfu');
    expect(config.forceReset).toBe(true);

    log('Successfully loaded configuration with custom values');
  });

  it('should handle partial configuration and use defaults', async () => {
    const partialConfig: Partial<CacheConfig> = {
      cacheSize: 200,
      evictionPolicy: 'adaptive',
    };

    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(partialConfig));

    const config = await loadConfig();

    expect(config.cacheSize).toBe(200);
    expect(config.evictionPolicy).toBe('adaptive');
    expect(config.cacheMaxAge).toBeDefined();
    expect(config.persistenceInterval).toBeDefined();

    log('Successfully handled partial configuration and used defaults');
  });

  it('should handle configuration with extra properties', async () => {
    const configWithExtra = {
      cacheSize: 100,
      cacheMaxAge: 3600000,
      extraProperty: 'should be ignored',
    };

    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(configWithExtra));

    const config = await loadConfig();

    expect(config.cacheSize).toBe(100);
    expect(config.cacheMaxAge).toBe(3600000);
    expect('extraProperty' in config).toBe(false);

    log('Successfully handled configuration with extra properties');
  });

  it('should load configuration with all possible eviction policies', async () => {
    const evictionPolicies: EvictionPolicy[] = ['lru', 'lfu', 'adaptive'];

    for (const policy of evictionPolicies) {
      const mockConfig: Partial<CacheConfig> = {
        evictionPolicy: policy,
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await loadConfig();

      expect(config.evictionPolicy).toBe(policy);
    }

    log('Successfully loaded configuration with all possible eviction policies');
  });

  it('should handle configuration with minimum values', async () => {
    const minConfig: CacheConfig = {
      cacheSize: 1,
      cacheMaxAge: 1,
      persistenceInterval: 1,
      maxMemoryUsage: 1,
      evictionPolicy: 'lru',
      prefetchThreshold: 0,
      compressionLevel: 0,
      algorithm: 'aes-128-gcm',
      keySize: 128,
      batchSize: 1,
      autoTuneInterval: 1,
      keyCheckIntervalMs: 1,
      keyRotationIntervalMs: 1,
      forceReset: false,
      encryptionPassword: '',
    };

    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(minConfig));

    const config = await loadConfig();

    expect(config).toEqual(minConfig);

    log('Successfully handled configuration with minimum values');
  });
});
