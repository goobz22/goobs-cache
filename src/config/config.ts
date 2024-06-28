'use server';
import fs from 'fs/promises';
import path from 'path';

/**
 * EncryptionAlgorithm type represents the supported encryption algorithms.
 */
type EncryptionAlgorithm = 'aes-256-gcm' | 'aes-192-gcm' | 'aes-128-gcm';

/**
 * EvictionPolicy type represents the supported cache eviction policies.
 */
type EvictionPolicy = 'lru' | 'lfu' | 'random';

/**
 * StorageType type represents the supported storage types.
 */
type StorageType = 'memory' | 'mongodb';

/**
 * Config interface defines the configuration options for the reusable store.
 */
export interface Config {
  algorithm: EncryptionAlgorithm;
  compressionLevel: -1 | 0 | 1 | 9;
  cacheSize: number;
  cacheMaxAge: number;
  persistenceInterval: number;
  maxMemoryUsage: number;
  evictionPolicy: EvictionPolicy;
  forceReset: boolean;
  prefetchThreshold: number;
  storageType: StorageType;
  mongodbUri: string;
  mongoPoolSize: number;
  keyRotationIntervalMs: number;
  batchSize: number;
  prefetchInterval: number;
}

/**
 * defaultConfig object represents the default configuration values.
 */
const defaultConfig: Config = {
  algorithm: 'aes-256-gcm',
  compressionLevel: -1,
  cacheSize: 10000,
  cacheMaxAge: 86400000, // 24 hours
  persistenceInterval: 600000, // 10 minutes
  maxMemoryUsage: 1073741824, // 1GB
  evictionPolicy: 'lru',
  forceReset: false,
  prefetchThreshold: 5,
  storageType: 'memory',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/reusablestore',
  mongoPoolSize: 10,
  keyRotationIntervalMs: 7776000000, // 90 days
  batchSize: 100,
  prefetchInterval: 300000, // 5 minutes
};

/**
 * loadConfig function loads the configuration from the environment variable or a config file.
 * It merges the loaded configuration with the default configuration.
 * @returns A Promise that resolves to the merged configuration.
 */
async function loadConfig(): Promise<Config> {
  let userConfig: Partial<Config> = {};

  // Try to load config from environment variable
  const envConfig = process.env.REUSABLESTORE_CONFIG;
  if (envConfig) {
    try {
      userConfig = JSON.parse(envConfig);
    } catch (error) {
      console.warn(
        'Failed to parse REUSABLESTORE_CONFIG environment variable. Using default configuration.',
      );
    }
  } else {
    // Fallback to file-based config if not in production (for local development)
    if (process.env.NODE_ENV !== 'production') {
      const configPath = path.join(process.cwd(), '.reusablestore.json');
      try {
        const fileExists = await fs
          .access(configPath)
          .then(() => true)
          .catch(() => false);
        if (fileExists) {
          const fileContent = await fs.readFile(configPath, 'utf-8');
          userConfig = JSON.parse(fileContent);
        } else {
          console.warn('Config file .reusablestore.json not found. Using default configuration.');
        }
      } catch (error) {
        console.warn('Failed to read or parse .reusablestore.json. Using default configuration.');
      }
    }
  }

  return { ...defaultConfig, ...userConfig };
}

/**
 * getConfig function is the default export that loads the configuration using the loadConfig function.
 * @returns A Promise that resolves to the loaded configuration.
 */
export default async function getConfig(): Promise<Config> {
  return await loadConfig();
}
