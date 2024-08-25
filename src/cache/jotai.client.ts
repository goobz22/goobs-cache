'use client';
import JotaiClientModule from '../utils/jotai.client';
import { ClientLogger } from 'goobs-testing';
import { GlobalConfig } from '../types';

const defaultGlobalConfig: Pick<GlobalConfig, 'loggingEnabled' | 'logLevel' | 'logDirectory'> = {
  loggingEnabled: true,
  logLevel: 'debug',
  logDirectory: 'logs',
};

export const jotai = {
  globalConfig: defaultGlobalConfig,

  initialize(encryptionPassword?: string) {
    ClientLogger.debug('Initializing jotai module');
    JotaiClientModule.initialize(encryptionPassword);
    ClientLogger.debug('Jotai module initialized');
  },

  atom: JotaiClientModule.atom,
  useAtom: JotaiClientModule.useAtom,

  updateConfig(
    newGlobalConfig?: Partial<Pick<GlobalConfig, 'loggingEnabled' | 'logLevel' | 'logDirectory'>>,
    newEncryptionPassword?: string,
  ) {
    ClientLogger.debug('Updating jotai configuration');
    if (newGlobalConfig) {
      this.globalConfig = { ...this.globalConfig, ...newGlobalConfig };
    }
    JotaiClientModule.updateConfig(undefined, this.globalConfig, newEncryptionPassword);
    ClientLogger.debug('Jotai configuration updated');
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    ClientLogger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

// Initialize the module without encryption by default
jotai.initialize();

export default jotai;
