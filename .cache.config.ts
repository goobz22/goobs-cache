import { CacheConfig, EvictionPolicy, LogLevel } from './src/types';

const cacheConfiguration: CacheConfig = {
  serverless: {
    cacheSize: 10000,
    cacheMaxAge: 86400000,
    persistenceInterval: 600000,
    maxMemoryUsage: 1073741824,
    evictionPolicy: 'lru' as EvictionPolicy,
    prefetchThreshold: 0.9,
    forceReset: false,
    compression: {
      compressionLevel: -1,
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      encryptionPassword: 'your-secure-encryption-password-here-serverless',
      keyCheckIntervalMs: 86400000,
      keyRotationIntervalMs: 7776000000,
    },
  },
  session: {
    cacheSize: 5000,
    cacheMaxAge: 1800000,
    evictionPolicy: 'lru' as EvictionPolicy,
    compression: {
      compressionLevel: -1,
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      encryptionPassword: 'your-secure-encryption-password-here-session',
      keyCheckIntervalMs: 86400000,
      keyRotationIntervalMs: 7776000000,
    },
  },
  cookie: {
    cacheSize: 1000,
    cacheMaxAge: 604800000,
    maxCookieSize: 4096,
    evictionPolicy: 'lru' as EvictionPolicy,
    compression: {
      compressionLevel: -1,
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      encryptionPassword: 'your-secure-encryption-password-here-cookie',
      keyCheckIntervalMs: 86400000,
      keyRotationIntervalMs: 7776000000,
    },
  },
  global: {
    keySize: 256,
    batchSize: 100,
    autoTuneInterval: 3600000,
    loggingEnabled: true,
    logLevel: 'debug' as LogLevel,
    logDirectory: 'logs',
  },
};

export default cacheConfiguration;
