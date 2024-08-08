import { ServerlessCacheConfig, GlobalConfig } from '../types';
import defaultConfig from '../../.cache.config';
import fs from 'fs/promises';
import path from 'path';
import { ServerLogger } from './logger.server';

type ServerCacheConfig = {
  serverless: ServerlessCacheConfig;
  global: GlobalConfig;
};

let configPromise: Promise<ServerCacheConfig>;

const ServerConfigModule = {
  async loadConfig(): Promise<ServerCacheConfig> {
    try {
      await ServerLogger.info('Starting to load configuration');
      let userConfig: Partial<ServerCacheConfig> = {};
      const userConfigPath = path.join(process.cwd(), '.cache.config.ts');

      try {
        await fs.access(userConfigPath);
        await ServerLogger.debug(`User config file found at ${userConfigPath}`);
        const userConfigModule = await import(userConfigPath);
        userConfig = userConfigModule.default || userConfigModule;
        await ServerLogger.info('User configuration loaded successfully');
      } catch (error) {
        await ServerLogger.warn(
          "User configuration not found or couldn't be imported, using default config",
          { error },
        );
      }

      const mergedConfig: ServerCacheConfig = {
        serverless: { ...defaultConfig.serverless, ...userConfig.serverless },
        global: { ...defaultConfig.global, ...userConfig.global },
      };

      await ServerLogger.info('Configuration loaded and merged successfully');
      await ServerLogger.debug('Merged configuration', { config: mergedConfig });

      return mergedConfig;
    } catch (error) {
      await ServerLogger.error('Error loading configuration', { error });
      await ServerLogger.info('Falling back to default configuration');
      return {
        serverless: defaultConfig.serverless,
        global: defaultConfig.global,
      };
    }
  },

  async getConfig(): Promise<ServerCacheConfig> {
    if (!configPromise) {
      await ServerLogger.debug('Config not cached, loading configuration');
      configPromise = this.loadConfig();
    } else {
      await ServerLogger.debug('Returning cached configuration');
    }
    return await configPromise;
  },

  async updateConfig(newConfig: Partial<ServerCacheConfig>): Promise<void> {
    await ServerLogger.info('Updating configuration');
    const currentConfig = await this.getConfig();
    const updatedConfig: ServerCacheConfig = {
      serverless: { ...currentConfig.serverless, ...newConfig.serverless },
      global: { ...currentConfig.global, ...newConfig.global },
    };
    configPromise = Promise.resolve(updatedConfig);
    await ServerLogger.info('Configuration updated successfully');
    await ServerLogger.debug('Updated configuration', { config: updatedConfig });
  },
};

// Initialize the logger
ServerConfigModule.getConfig()
  .then(async (config) => {
    await ServerLogger.initializeLogger(config.global);
    await ServerLogger.info('ServerLogger initialized');
  })
  .catch(async (error) => {
    console.error('Failed to initialize ServerLogger', error);
  });

export default ServerConfigModule;
