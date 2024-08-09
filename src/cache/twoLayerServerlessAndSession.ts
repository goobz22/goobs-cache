import serverless from './serverless.server';
import session from './session.client';
import { ClientLogger } from 'goobs-testing';
import { CacheResult, DataValue, TwoLayerMode } from '../types';

class TwoLayerCache {
  private async initializeCaches(): Promise<void> {
    const startTime = performance.now();
    ClientLogger.info('Initializing caches');
    ClientLogger.info('Caches initialized');
    const duration = performance.now() - startTime;
    ClientLogger.debug('Caches initialized', { duration: `${duration.toFixed(2)}ms` });
  }

  private createEmptyResult(identifier: string, storeName: string): CacheResult {
    ClientLogger.debug('Creating empty result', { identifier, storeName });
    return {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    };
  }

  async update(
    identifier: string,
    storeName: string,
    value: DataValue,
    mode: TwoLayerMode = 'both',
  ): Promise<void> {
    const startTime = performance.now();
    ClientLogger.info('Updating cache', { identifier, storeName, mode });
    await this.initializeCaches();
    try {
      if (mode === 'serverless' || mode === 'both') {
        ClientLogger.debug('Updating serverless cache', { identifier, storeName });
        const serverlessAtom = serverless.atom(identifier, storeName);
        await serverlessAtom.set(value);
        ClientLogger.info('Serverless cache updated', { identifier, storeName });
      }
      if ((mode === 'session' || mode === 'both') && typeof window !== 'undefined') {
        ClientLogger.debug('Updating session storage', { identifier, storeName });
        const sessionAtom = session.atom(value);
        const [, setValue] = session.useAtom(sessionAtom);
        setValue(value);
        ClientLogger.info('Session storage updated', { identifier, storeName });
      }
      const duration = performance.now() - startTime;
      ClientLogger.debug('Cache update completed', { duration: `${duration.toFixed(2)}ms` });
    } catch (error) {
      ClientLogger.error('Error updating cache', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        identifier,
        storeName,
        mode,
      });
      throw error;
    }
  }

  async get(
    identifier: string,
    storeName: string,
    mode: TwoLayerMode = 'both',
  ): Promise<CacheResult> {
    const startTime = performance.now();
    ClientLogger.info('Getting from cache', { identifier, storeName, mode });
    await this.initializeCaches();
    try {
      let result: CacheResult | undefined;
      if (mode === 'session' && typeof window !== 'undefined') {
        ClientLogger.debug('Getting from session storage', { identifier, storeName });
        const sessionAtom = session.atom(undefined);
        const [sessionValue] = session.useAtom(sessionAtom);
        if (sessionValue !== undefined) {
          const value = await sessionValue;
          if (value !== undefined) {
            result = {
              identifier,
              storeName,
              value,
              expirationDate: new Date(),
              lastUpdatedDate: new Date(),
              lastAccessedDate: new Date(),
              getHitCount: 1,
              setHitCount: 0,
            };
            ClientLogger.info('Retrieved from session storage', { identifier, storeName });
          }
        }
      } else if (mode === 'serverless') {
        ClientLogger.debug('Getting from serverless cache', { identifier, storeName });
        const serverlessAtom = serverless.atom(identifier, storeName);
        const serverlessResult = await serverlessAtom.get();
        if (serverlessResult) {
          result = serverlessResult;
          ClientLogger.info('Retrieved from serverless cache', { identifier, storeName });
        }
      } else if (typeof window !== 'undefined') {
        // mode is 'both' and we're on the client side
        ClientLogger.debug('Attempting to get from session storage first', {
          identifier,
          storeName,
        });
        const sessionAtom = session.atom(undefined);
        const [sessionValue, setSessionValue] = session.useAtom(sessionAtom);
        if (sessionValue !== undefined) {
          const value = await sessionValue;
          if (value !== undefined) {
            result = {
              identifier,
              storeName,
              value,
              expirationDate: new Date(),
              lastUpdatedDate: new Date(),
              lastAccessedDate: new Date(),
              getHitCount: 1,
              setHitCount: 0,
            };
            ClientLogger.info('Retrieved from session storage', { identifier, storeName });
          }
        }

        if (!result) {
          ClientLogger.debug('Not found in session storage, trying serverless cache', {
            identifier,
            storeName,
          });
          const serverlessAtom = serverless.atom(identifier, storeName);
          const serverlessResult = await serverlessAtom.get();
          if (serverlessResult) {
            result = serverlessResult;
            ClientLogger.info('Retrieved from serverless cache', { identifier, storeName });
            ClientLogger.debug('Updating session storage with serverless result', {
              identifier,
              storeName,
            });
            // Store the value in a way that conforms to the session atom's type constraints
            setSessionValue(() => Promise.resolve(undefined));
            // You may need to implement a separate mechanism to store the actual value
            // For example, you could use localStorage or another storage method
            localStorage.setItem(
              `${identifier}:${storeName}`,
              JSON.stringify(serverlessResult.value),
            );
          }
        }
      } else {
        // mode is 'both' and we're on the server side
        ClientLogger.debug('On server side, getting directly from serverless cache', {
          identifier,
          storeName,
        });
        const serverlessAtom = serverless.atom(identifier, storeName);
        const serverlessResult = await serverlessAtom.get();
        if (serverlessResult) {
          result = serverlessResult;
          ClientLogger.info('Retrieved from serverless cache', { identifier, storeName });
        }
      }

      if (!result) {
        ClientLogger.info('Not found in cache, returning empty result', { identifier, storeName });
        result = this.createEmptyResult(identifier, storeName);
      }

      const duration = performance.now() - startTime;
      ClientLogger.debug('Cache get operation completed', {
        duration: `${duration.toFixed(2)}ms`,
        resultFound: result.value !== undefined,
      });
      return result;
    } catch (error) {
      ClientLogger.error('Error getting from cache', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        identifier,
        storeName,
        mode,
      });
      throw error;
    }
  }

  async remove(identifier: string, storeName: string, mode: TwoLayerMode = 'both'): Promise<void> {
    const startTime = performance.now();
    ClientLogger.info('Removing from cache', { identifier, storeName, mode });
    await this.initializeCaches();
    try {
      if (mode === 'serverless' || mode === 'both') {
        ClientLogger.debug('Removing from serverless cache', { identifier, storeName });
        const serverlessAtom = serverless.atom(identifier, storeName);
        await serverlessAtom.remove();
        ClientLogger.info('Removed from serverless cache', { identifier, storeName });
      }
      if ((mode === 'session' || mode === 'both') && typeof window !== 'undefined') {
        ClientLogger.debug('Removing from session storage', { identifier, storeName });
        const sessionAtom = session.atom(undefined);
        const [, setSessionValue] = session.useAtom(sessionAtom);

        // Remove the value from the session atom
        setSessionValue(() => Promise.resolve(undefined));

        // Remove the value from localStorage
        localStorage.removeItem(`${identifier}:${storeName}`);

        ClientLogger.info('Removed from session storage', { identifier, storeName });
      }
      const duration = performance.now() - startTime;
      ClientLogger.debug('Cache remove operation completed', {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      ClientLogger.error('Error removing from cache', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        identifier,
        storeName,
        mode,
      });
      throw error;
    }
  }

  async clear(mode: TwoLayerMode = 'both'): Promise<void> {
    const startTime = performance.now();
    ClientLogger.info('Clearing cache', { mode });
    await this.initializeCaches();
    try {
      if (mode === 'serverless' || mode === 'both') {
        ClientLogger.debug('Clearing serverless cache');
        await serverless.clear();
        ClientLogger.info('Serverless cache cleared');
      }
      if ((mode === 'session' || mode === 'both') && typeof window !== 'undefined') {
        ClientLogger.debug('Clearing session storage');

        // Clear session atoms
        const sessionAtom = session.atom(undefined);
        const [, setSessionValue] = session.useAtom(sessionAtom);
        setSessionValue(() => Promise.resolve(undefined));

        // Clear localStorage items related to our cache
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes(':')) {
            // Assuming our keys contain ':'
            localStorage.removeItem(key);
          }
        }

        ClientLogger.info('Session storage cleared');
      }
      const duration = performance.now() - startTime;
      ClientLogger.debug('Cache clear operation completed', {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      ClientLogger.error('Error clearing cache', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        mode,
      });
      throw error;
    }
  }

  async updateConfig(): Promise<void> {
    const startTime = performance.now();
    ClientLogger.info('Updating cache configuration');
    try {
      await serverless.updateConfig();
      ClientLogger.info('Serverless cache configuration updated');

      if (typeof window !== 'undefined') {
        // Reinitialize session atom
        const sessionAtom = session.atom(undefined);
        const [, setSessionValue] = session.useAtom(sessionAtom);
        setSessionValue(() => Promise.resolve(undefined));
        ClientLogger.info('Session storage configuration updated');
      }

      const duration = performance.now() - startTime;
      ClientLogger.debug('Cache configuration update completed', {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      ClientLogger.error('Error updating cache configuration', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}

export const twoLayer = new TwoLayerCache();

if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    ClientLogger.error('Unhandled Rejection at:', {
      promise,
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    ClientLogger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export default twoLayer;
