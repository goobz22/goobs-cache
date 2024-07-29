import { ServerCache, createServerCache } from './serverless.server';
import SessionStorageCache from './session.client';
import { TwoLayerClientCache, ClientStorage, ServerStorage } from '../utils/twoLayerCache.client';
import { TwoLayerServerCache } from '../utils/twoLayerCache.server';
import { CacheConfig, CacheResult, DataValue } from '../types';

class ServerCacheAdapter implements ServerStorage {
  private serverCachePromise: Promise<ServerCache>;

  constructor(config: CacheConfig) {
    this.serverCachePromise = createServerCache(config, config.encryptionPassword);
  }

  private async getServerCache(): Promise<ServerCache> {
    return await this.serverCachePromise;
  }

  async get(identifier: string, storeName: string): Promise<CacheResult> {
    const serverCache = await this.getServerCache();
    return serverCache.get(identifier, storeName);
  }

  async set(
    identifier: string,
    storeName: string,
    value: DataValue,
    expirationDate: Date,
  ): Promise<void> {
    const serverCache = await this.getServerCache();
    return serverCache.set(identifier, storeName, value, expirationDate);
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    const serverCache = await this.getServerCache();
    return serverCache.remove(identifier, storeName);
  }

  async clear(): Promise<void> {
    const serverCache = await this.getServerCache();
    return serverCache.clear();
  }

  subscribeToUpdates<T extends DataValue>(
    identifier: string,
    storeName: string,
    listener: (data: T) => void,
  ): () => void {
    let unsubscribe: (() => void) | undefined;

    this.getServerCache().then((serverCache) => {
      unsubscribe = serverCache.subscribeToUpdates(identifier, storeName, listener);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }
}

class SessionStorageAdapter implements ClientStorage {
  private sessionStorage: SessionStorageCache;

  constructor(config: CacheConfig) {
    this.sessionStorage = new SessionStorageCache(config);
  }

  get(
    identifier: string,
    storeName: string,
    callback: (result: CacheResult | undefined) => void,
  ): void {
    this.sessionStorage.get(identifier, storeName, callback);
  }

  set(identifier: string, storeName: string, value: DataValue, expirationDate: Date): void {
    this.sessionStorage.set(identifier, storeName, value, expirationDate);
  }

  remove(identifier: string, storeName: string): void {
    this.sessionStorage.remove(identifier, storeName);
  }

  clear(): void {
    this.sessionStorage.clear();
  }
}

type ListenerMap = Map<string, Set<(data: DataValue) => void>>;

export class TwoLayerCache {
  private clientCache: TwoLayerClientCache | null = null;
  private serverCache: TwoLayerServerCache;
  private listeners: ListenerMap = new Map();
  private isClient: boolean;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    const serverStorage = new ServerCacheAdapter(config);
    this.isClient = typeof window !== 'undefined';

    if (this.isClient) {
      const clientStorage = new SessionStorageAdapter(config);
      this.clientCache = new TwoLayerClientCache(config, clientStorage, serverStorage);
    }

    this.serverCache = new TwoLayerServerCache(config, serverStorage);

    // Subscribe to server updates
    this.serverCache.subscribeToUpdates<DataValue>('*', '*', (data: DataValue) => {
      if (
        typeof data === 'object' &&
        data !== null &&
        'identifier' in data &&
        'storeName' in data &&
        'value' in data
      ) {
        const { identifier, storeName, value } = data as {
          identifier: string;
          storeName: string;
          value: DataValue;
        };
        this.notifyListeners(identifier, storeName, value);
      }
    });
  }

  private getKey(identifier: string, storeName: string): string {
    return `${identifier}:${storeName}`;
  }

  private notifyListeners(identifier: string, storeName: string, value: DataValue): void {
    const key = this.getKey(identifier, storeName);
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach((listener) => listener(value));
    }
  }

  async get(identifier: string, storeName: string): Promise<CacheResult> {
    return new Promise((resolve) => {
      if (this.isClient && this.clientCache) {
        this.clientCache.get(identifier, storeName, (clientResult) => {
          if (clientResult && clientResult.value !== undefined) {
            resolve(clientResult);
          } else {
            this.serverCache.get(identifier, storeName).then((serverResult) => {
              if (serverResult.value !== undefined && this.isClient && this.clientCache) {
                this.clientCache.set(
                  identifier,
                  storeName,
                  serverResult.value,
                  serverResult.expirationDate,
                );
                this.notifyListeners(identifier, storeName, serverResult.value);
              }
              resolve(serverResult);
            });
          }
        });
      } else {
        this.serverCache.get(identifier, storeName).then((serverResult) => {
          resolve(serverResult);
        });
      }
    });
  }

  async set(
    identifier: string,
    storeName: string,
    value: DataValue,
    expirationDate: Date,
  ): Promise<void> {
    await this.serverCache.set(identifier, storeName, value, expirationDate);
    if (this.isClient && this.clientCache) {
      this.clientCache.set(identifier, storeName, value, expirationDate);
    }
    this.notifyListeners(identifier, storeName, value);
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    await this.serverCache.remove(identifier, storeName);
    if (this.isClient && this.clientCache) {
      this.clientCache.remove(identifier, storeName);
    }
    this.notifyListeners(identifier, storeName, undefined);
  }

  async clear(): Promise<void> {
    await this.serverCache.clear();
    if (this.isClient && this.clientCache) {
      this.clientCache.clear();
    }
    this.notifyListeners('*', '*', undefined);
  }

  subscribeToUpdates(
    identifier: string,
    storeName: string,
    listener: (data: DataValue) => void,
  ): () => void {
    const key = this.getKey(identifier, storeName);
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.add(listener);
    }

    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  isClientSide(): boolean {
    return this.isClient;
  }

  async preloadCache(data: { [key: string]: { [store: string]: DataValue } }): Promise<void> {
    for (const [identifier, stores] of Object.entries(data)) {
      for (const [storeName, value] of Object.entries(stores)) {
        await this.set(
          identifier,
          storeName,
          value,
          new Date(Date.now() + this.config.cacheMaxAge),
        );
      }
    }
  }
}

export default TwoLayerCache;
