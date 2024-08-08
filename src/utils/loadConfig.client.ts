import { SessionCacheConfig, CookieCacheConfig, GlobalConfig } from '../types';
import defaultConfig from '../../.cache.config';
import { ClientLogger } from './logger.client';

type ClientCacheConfig = {
  session: SessionCacheConfig;
  cookie: CookieCacheConfig;
  global: GlobalConfig;
};

const ClientConfigModule = {
  config: {
    session: defaultConfig.session,
    cookie: defaultConfig.cookie,
    global: defaultConfig.global,
  } as ClientCacheConfig,

  initializeLogger(): void {
    ClientLogger.initializeLogger(this.config.global);
    ClientLogger.info('ClientConfigModule initialized', {
      config: {
        ...this.config,
        global: { ...this.config.global, encryptionPassword: '[REDACTED]' },
      },
    });
  },

  getConfig(): ClientCacheConfig {
    ClientLogger.debug('Retrieving client cache configuration');
    return this.config;
  },

  updateConfig(newConfig: Partial<ClientCacheConfig>): void {
    ClientLogger.info('Updating client cache configuration', {
      oldConfig: {
        ...this.config,
        global: { ...this.config.global, encryptionPassword: '[REDACTED]' },
      },
      newConfig: {
        ...newConfig,
        global: newConfig.global
          ? { ...newConfig.global, encryptionPassword: '[REDACTED]' }
          : undefined,
      },
    });

    this.config = {
      session: { ...this.config.session, ...newConfig.session },
      cookie: { ...this.config.cookie, ...newConfig.cookie },
      global: { ...this.config.global, ...newConfig.global },
    };

    // Reinitialize logger with updated global config
    this.initializeLogger();

    ClientLogger.info('Client cache configuration updated successfully');
  },
};

// Initialize logger when the module is first loaded
ClientConfigModule.initializeLogger();

// Add an unhandled rejection handler for browser environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    ClientLogger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export default ClientConfigModule;
