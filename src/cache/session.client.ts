'use client';

import SessionClientModule from '../utils/session.client';
import { ClientLogger } from 'goobs-testing';
import { GlobalConfig } from '../types';

const defaultGlobalConfig: Pick<GlobalConfig, 'loggingEnabled' | 'logLevel' | 'logDirectory'> = {
  loggingEnabled: true,
  logLevel: 'debug',
  logDirectory: 'logs',
};

export const session = {
  globalConfig: defaultGlobalConfig,

  initialize(encryptionPassword?: string) {
    ClientLogger.debug('Initializing session module');
    SessionClientModule.initialize(encryptionPassword);
    ClientLogger.debug('Session module initialized');
  },

  atom: SessionClientModule.atom,
  useAtom: SessionClientModule.useAtom,

  updateConfig(
    newGlobalConfig?: Partial<Pick<GlobalConfig, 'loggingEnabled' | 'logLevel' | 'logDirectory'>>,
    newEncryptionPassword?: string,
  ) {
    ClientLogger.debug('Updating session configuration');
    if (newGlobalConfig) {
      this.globalConfig = { ...this.globalConfig, ...newGlobalConfig };
    }
    SessionClientModule.updateConfig(undefined, this.globalConfig, newEncryptionPassword);
    ClientLogger.debug('Session configuration updated');
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
session.initialize();

export default session;
