/**
 * @file ReusableStore.ts
 * @description Provides the main interface for the ReusableStore, handling both server-side and client-side caching operations with automatic two-layer synchronization.
 */
import { createLogger, format, transports } from 'winston';
import {
  DataValue,
  CacheMode,
  CacheResult,
  CacheConfig,
  TwoLayerMode,
  IndividualCacheConfig,
  ServerlessCacheConfig,
  SessionCacheConfig,
  CookieCacheConfig,
  BaseCacheConfig,
  GlobalConfig,
} from '../types';
import {
  update as twoLayerUpdate,
  get as twoLayerGet,
  remove as twoLayerRemove,
  initializeTwoLayerModule,
} from '../cache/twoLayerServerlessAndSession';
import defaultConfig from '../../.cache.config';
import fs from 'fs';
import path from 'path';

let logger: ReturnType<typeof createLogger> | null = null;

/** Determines if the code is running on the server or client side. */
const isServer = typeof window === 'undefined';

/** Load the configuration */
async function loadConfig(): Promise<CacheConfig> {
  try {
    let userConfig: Partial<CacheConfig> = {};
    const userConfigPath = path.join(process.cwd(), '.cache.config.ts');

    if (fs.existsSync(userConfigPath)) {
      const userConfigModule = await import(userConfigPath);
      userConfig = userConfigModule.default || userConfigModule;
    }

    const mergedConfig: CacheConfig = {
      serverless: { ...defaultConfig.serverless, ...userConfig.serverless },
      session: { ...defaultConfig.session, ...userConfig.session },
      cookie: { ...defaultConfig.cookie, ...userConfig.cookie },
      global: { ...defaultConfig.global, ...userConfig.global },
    };

    return mergedConfig;
  } catch (error) {
    console.error('Error loading configuration', error);
    return defaultConfig;
  }
}

let configPromise = loadConfig();

function initializeLogger(globalConfig: GlobalConfig) {
  if (!logger) {
    logger = createLogger({
      level: globalConfig.logLevel,
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
      ),
      defaultMeta: { service: 'reusable-store' },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ level, message, timestamp, metadata }) => {
              let msg = `${timestamp} [${level}]: ${message}`;
              if (Object.keys(metadata).length > 0) {
                msg += '\n\t' + JSON.stringify(metadata);
              }
              return msg;
            }),
          ),
        }),
        new transports.File({
          filename: path.join(globalConfig.logDirectory, 'error.log'),
          level: 'error',
        }),
        new transports.File({
          filename: path.join(globalConfig.logDirectory, 'combined.log'),
        }),
      ],
      silent: !globalConfig.loggingEnabled,
    });
  }
}

async function getCacheConfig(
  mode: CacheMode,
): Promise<
  IndividualCacheConfig | { serverless: ServerlessCacheConfig; session: SessionCacheConfig }
> {
  const config = await configPromise;
  switch (mode) {
    case 'serverless':
      return config.serverless;
    case 'session':
      return config.session;
    case 'cookie':
      return config.cookie;
    case 'twoLayer':
      return {
        serverless: config.serverless,
        session: config.session,
      };
    default:
      throw new Error(`Invalid cache mode: ${mode}`);
  }
}

export async function set(
  identifier: string,
  storeName: string,
  value: DataValue,
  mode: CacheMode,
  expirationDate?: Date,
  twoLayerMode?: TwoLayerMode,
): Promise<void> {
  const config = await configPromise;
  if (!logger) {
    initializeLogger(config.global);
  }
  logger!.info('Setting value in cache', { identifier, storeName, mode, twoLayerMode });
  logger!.debug('Set operation details', {
    identifier,
    storeName,
    valueType: typeof value,
    mode,
    expirationDate: expirationDate?.toISOString(),
    twoLayerMode,
  });

  try {
    const modeConfig = await getCacheConfig(mode);
    logger!.debug('Mode configuration', { mode, config: modeConfig });

    const expDate =
      expirationDate || new Date(Date.now() + (modeConfig as BaseCacheConfig).cacheMaxAge);
    logger!.debug('Expiration date determined', { expDate: expDate.toISOString() });

    if (mode === 'twoLayer') {
      logger!.debug('Using two-layer update', { twoLayerMode });
      await twoLayerUpdate(
        identifier,
        storeName,
        value,
        config.serverless,
        config.session,
        twoLayerMode,
        config.global,
      );
      logger!.debug('Two-layer update completed');
    } else if (mode === 'serverless') {
      logger!.debug('Using serverless update');
      if (isServer) {
        const { serverlessSet } = await import('./reusableStore.server');
        await serverlessSet(
          identifier,
          storeName,
          value,
          expDate,
          mode,
          config.serverless,
          config.global,
        );
      } else {
        await twoLayerUpdate(
          identifier,
          storeName,
          value,
          config.serverless,
          config.session,
          'serverless',
          config.global,
        );
      }
      logger!.debug('Serverless update completed');
    } else if (!isServer && (mode === 'session' || mode === 'cookie')) {
      logger!.debug('Using client-side set', { mode });
      const { clientSet } = await import('./reusableStore.client');
      await clientSet(
        identifier,
        storeName,
        value,
        expDate,
        mode,
        modeConfig as SessionCacheConfig | CookieCacheConfig,
        config.global,
      );
      logger!.debug('Client-side set completed');
    } else {
      const errorMessage = `Invalid cache mode: ${mode}`;
      logger!.error(errorMessage, { mode });
      throw new Error(errorMessage);
    }

    logger!.info('Value set successfully', { identifier, storeName, mode });
  } catch (error) {
    logger!.error('Error setting value in cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

export async function get(
  identifier: string,
  storeName: string,
  mode: CacheMode,
  twoLayerMode?: TwoLayerMode,
): Promise<CacheResult> {
  const config = await configPromise;
  if (!logger) {
    initializeLogger(config.global);
  }
  logger!.info('Getting value from cache', { identifier, storeName, mode, twoLayerMode });
  logger!.debug('Get operation details', { identifier, storeName, mode, twoLayerMode });

  try {
    const modeConfig = await getCacheConfig(mode);
    logger!.debug('Mode configuration', { mode, config: modeConfig });

    let result: CacheResult;

    if (mode === 'twoLayer') {
      logger!.debug('Using two-layer get', { twoLayerMode });
      result = await twoLayerGet(
        identifier,
        storeName,
        config.serverless,
        config.session,
        twoLayerMode,
        config.global,
      );
      logger!.debug('Two-layer get completed', { resultExists: !!result.value });
    } else if (mode === 'serverless') {
      if (isServer) {
        logger!.debug('Using server-side serverless get');
        const { serverlessGet } = await import('./reusableStore.server');
        result = await serverlessGet(identifier, storeName, mode, config.serverless, config.global);
        logger!.debug('Server-side serverless get completed', { resultExists: !!result.value });
      } else {
        logger!.debug('Using client-side serverless get with session storage fallback');
        const { clientGet } = await import('./reusableStore.client');
        const clientResult = await clientGet(
          identifier,
          storeName,
          'session',
          config.session,
          config.global,
        );
        logger!.debug('Client-side session storage get completed', {
          resultExists: !!clientResult.value,
        });

        if (clientResult.value !== undefined) {
          logger!.debug('Value found in session storage', { identifier, storeName });
          result = clientResult;
        } else {
          logger!.debug('Value not found in session storage, fetching from serverless', {
            identifier,
            storeName,
          });
          result = await twoLayerGet(
            identifier,
            storeName,
            config.serverless,
            config.session,
            'serverless',
            config.global,
          );
          logger!.debug('Serverless get completed', { resultExists: !!result.value });

          if (result.value !== undefined) {
            logger!.debug('Updating session storage with serverless result', {
              identifier,
              storeName,
            });
            await set(identifier, storeName, result.value, 'session', result.expirationDate);
            logger!.debug('Session storage updated with serverless result');
          }
        }
      }
    } else if (!isServer && (mode === 'session' || mode === 'cookie')) {
      logger!.debug('Using client-side get', { mode });
      const { clientGet } = await import('./reusableStore.client');
      result = await clientGet(
        identifier,
        storeName,
        mode,
        modeConfig as SessionCacheConfig | CookieCacheConfig,
        config.global,
      );
      logger!.debug('Client-side get completed', { resultExists: !!result.value });
    } else {
      const errorMessage = `Invalid cache mode: ${mode}`;
      logger!.error(errorMessage, { mode });
      throw new Error(errorMessage);
    }

    logger!.info('Value retrieved from cache', {
      identifier,
      storeName,
      mode,
      resultExists: !!result.value,
      expirationDate: result.expirationDate,
      lastUpdatedDate: result.lastUpdatedDate,
      lastAccessedDate: result.lastAccessedDate,
      getHitCount: result.getHitCount,
      setHitCount: result.setHitCount,
    });

    return result;
  } catch (error) {
    logger!.error('Error getting value from cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

export async function remove(
  identifier: string,
  storeName: string,
  mode: CacheMode,
  twoLayerMode?: TwoLayerMode,
): Promise<void> {
  const config = await configPromise;
  if (!logger) {
    initializeLogger(config.global);
  }
  logger!.info('Removing value from cache', { identifier, storeName, mode, twoLayerMode });
  logger!.debug('Remove operation details', { identifier, storeName, mode, twoLayerMode });

  try {
    const modeConfig = await getCacheConfig(mode);
    logger!.debug('Mode configuration', { mode, config: modeConfig });

    if (mode === 'twoLayer') {
      logger!.debug('Using two-layer remove', { twoLayerMode });
      await twoLayerRemove(
        identifier,
        storeName,
        config.serverless,
        config.session,
        twoLayerMode,
        config.global,
      );
      logger!.debug('Two-layer remove completed');

      if (!isServer && (twoLayerMode === 'session' || twoLayerMode === 'both')) {
        logger!.debug('Removing from client-side session storage', { identifier, storeName });
        const { clientRemove } = await import('./reusableStore.client');
        await clientRemove(identifier, storeName, 'session', config.session, config.global);
        logger!.debug('Client-side session storage remove completed');
      }
    } else if (mode === 'serverless') {
      logger!.debug('Using serverless remove');
      if (isServer) {
        const { serverlessRemove } = await import('./reusableStore.server');
        await serverlessRemove(identifier, storeName, mode, config.serverless, config.global);
      } else {
        await twoLayerRemove(
          identifier,
          storeName,
          config.serverless,
          config.session,
          'serverless',
          config.global,
        );
      }
      logger!.debug('Serverless remove completed');
    } else if (!isServer && (mode === 'session' || mode === 'cookie')) {
      logger!.debug('Using client-side remove', { mode });
      const { clientRemove } = await import('./reusableStore.client');
      await clientRemove(
        identifier,
        storeName,
        mode,
        modeConfig as SessionCacheConfig | CookieCacheConfig,
        config.global,
      );
      logger!.debug('Client-side remove completed');
    } else {
      const errorMessage = `Invalid cache mode: ${mode}`;
      logger!.error(errorMessage, { mode });
      throw new Error(errorMessage);
    }

    logger!.info('Value removed successfully', { identifier, storeName, mode });
  } catch (error) {
    logger!.error('Error removing value from cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

// Initialize the module
(async () => {
  const config = await configPromise;
  initializeLogger(config.global);
  logger!.debug('Environment determined', { isServer });
  logger!.info('ReusableStore module loaded and ready', {
    environment: isServer ? 'server' : 'client',
    globalConfig: config.global,
  });
  initializeTwoLayerModule(config.serverless, config.session, config.global);
})().catch((error) => {
  console.error('Error during initialization', error);
});

// Add an unhandled rejection handler
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger!.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

// Add an uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger!.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  // Gracefully exit the process after logging
  process.exit(1);
});

// Export the logger for potential use in other modules
export { logger };

/**
 * Allows runtime update of the cache configuration.
 * @param newConfig - The new configuration to apply
 */
export async function updateCacheConfig(newConfig: Partial<CacheConfig>): Promise<void> {
  const currentConfig = await configPromise;
  const updatedConfig: CacheConfig = {
    serverless: { ...currentConfig.serverless, ...newConfig.serverless },
    session: { ...currentConfig.session, ...newConfig.session },
    cookie: { ...currentConfig.cookie, ...newConfig.cookie },
    global: { ...currentConfig.global, ...newConfig.global },
  };

  // Update the config promise
  configPromise = Promise.resolve(updatedConfig);

  // Reinitialize logger if global config changed
  if (newConfig.global) {
    initializeLogger(updatedConfig.global);
  }

  // Reinitialize two-layer module with new config
  initializeTwoLayerModule(updatedConfig.serverless, updatedConfig.session, updatedConfig.global);

  logger!.info('Cache configuration updated', { newConfig });
}

/**
 * Clears all caches (serverless, session, and cookie).
 */
export async function clearAllCaches(): Promise<void> {
  const config = await configPromise;
  logger!.info('Clearing all caches');
  try {
    if (isServer) {
      const { serverlessClear } = await import('./reusableStore.server');
      await serverlessClear(config.serverless, config.global);
    } else {
      const { clientClearAll } = await import('./reusableStore.client');
      await clientClearAll(config.cookie, config.global);
    }
    logger!.info('All caches cleared successfully');
  } catch (error) {
    logger!.error('Error clearing all caches', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export default {
  set,
  get,
  remove,
  getCacheConfig,
  updateCacheConfig,
  clearAllCaches,
};
