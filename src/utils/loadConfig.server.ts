import { ServerlessCacheConfig, GlobalConfig } from '../types';
import { serverlessConfig, globalConfig } from '../config';
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
      let userConfig: Partial<ServerCacheConfig> = {};
      const userConfigPath = path.join(process.cwd(), '.cache.config.ts');
      try {
        await fs.access(userConfigPath);
        const userConfigModule = await import(userConfigPath);
        userConfig = userConfigModule.default || userConfigModule;
      } catch {
        await ServerLogger.warn(
          'User config not found or could not be imported. Using default configuration.',
        );
      }
      const mergedConfig: ServerCacheConfig = {
        serverless: { ...serverlessConfig, ...userConfig.serverless },
        global: { ...globalConfig, ...userConfig.global },
      };
      return mergedConfig;
    } catch (err) {
      await ServerLogger.error('Error loading configuration', {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        serverless: serverlessConfig,
        global: globalConfig,
      };
    }
  },

  async getConfig(): Promise<ServerCacheConfig> {
    if (!configPromise) {
      configPromise = this.loadConfig();
    }
    return await configPromise;
  },

  async updateConfig(newConfig: Partial<ServerCacheConfig>): Promise<void> {
    const currentConfig = await this.getConfig();
    const updatedConfig: ServerCacheConfig = {
      serverless: { ...currentConfig.serverless, ...newConfig.serverless },
      global: { ...currentConfig.global, ...newConfig.global },
    };
    configPromise = Promise.resolve(updatedConfig);
  },
};

export default ServerConfigModule;
