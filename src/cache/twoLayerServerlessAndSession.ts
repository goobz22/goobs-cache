import { ServerlessCache, createServerlessCache } from './serverless.server';
import SessionStorageCache from './session.client';
import { TwoLayerClientCache, ClientStorage, ServerStorage } from '../utils/twoLayerCache.client';
import { TwoLayerServerCache } from '../utils/twoLayerCache.server';
import { CacheConfig, CacheResult, DataValue } from '../types';
import { realTimeSync } from '../utils/realTimeServerToClient';

class ServerlessAdapter implements ServerStorage {
  private serverlessCachePromise: Promise<ServerlessCache>;

  constructor(config: CacheConfig) {
    this.serverlessCachePromise = createServerlessCache(config, config.encryptionPassword);
  }

  private async getServerlessCache(): Promise<ServerlessCache> {
    return await this.serverlessCachePromise;
  }

  async get(identifier: string, storeName: string): Promise<CacheResult> {
    const serverlessCache = await this.getServerlessCache();
    return serverlessCache.get(identifier, storeName);
  }

  async set(
    identifier: string,
    storeName: string,
    value: DataValue,
    expirationDate: Date,
  ): Promise<void> {
    const serverlessCache = await this.getServerlessCache();
    await serverlessCache.set(identifier, storeName, value, expirationDate);
    realTimeSync.handleCacheUpdate({
      identifier,
      storeName,
      value,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    });
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    const serverlessCache = await this.getServerlessCache();
    await serverlessCache.remove(identifier, storeName);
    realTimeSync.handleCacheUpdate({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 0,
    });
  }

  async clear(): Promise<void> {
    const serverlessCache = await this.getServerlessCache();
    await serverlessCache.clear();
    realTimeSync.handleCacheUpdate({
      identifier: '*',
      storeName: '*',
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 0,
    });
  }

  subscribeToUpdates<T extends DataValue>(
    identifier: string,
    storeName: string,
    listener: (data: T) => void,
  ): () => void {
    return realTimeSync.subscribe<T>(identifier, storeName, listener);
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

export class TwoLayerCache {
  private clientCache: TwoLayerClientCache | null = null;
  private serverCache: TwoLayerServerCache;
  private isClient: boolean;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    const serverStorage = new ServerlessAdapter(config);
    this.isClient = typeof window !== 'undefined';

    if (this.isClient) {
      const clientStorage = new SessionStorageAdapter(config);
      this.clientCache = new TwoLayerClientCache(config, clientStorage, serverStorage);
    }

    this.serverCache = new TwoLayerServerCache(config, serverStorage);

    if (this.isClient) {
      realTimeSync.subscribe('*', '*', (data: DataValue) => {
        if (this.clientCache && typeof data === 'object' && data !== null) {
          const cacheResult = data as Partial<CacheResult>;
          if (
            typeof cacheResult.identifier === 'string' &&
            typeof cacheResult.storeName === 'string' &&
            cacheResult.value !== undefined &&
            cacheResult.expirationDate instanceof Date
          ) {
            this.clientCache.set(
              cacheResult.identifier,
              cacheResult.storeName,
              cacheResult.value,
              cacheResult.expirationDate,
            );
          }
        }
      });
    }
  }

  async get(identifier: string, storeName: string): Promise<CacheResult> {
    if (this.isClient && this.clientCache) {
      return new Promise((resolve) => {
        this.clientCache!.get(identifier, storeName, (clientResult) => {
          if (clientResult && clientResult.value !== undefined) {
            resolve(clientResult);
          } else {
            this.serverCache.get(identifier, storeName).then((serverResult) => {
              if (serverResult.value !== undefined) {
                this.clientCache!.set(
                  identifier,
                  storeName,
                  serverResult.value,
                  serverResult.expirationDate,
                );
              }
              resolve(serverResult);
            });
          }
        });
      });
    } else {
      return this.serverCache.get(identifier, storeName);
    }
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
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    await this.serverCache.remove(identifier, storeName);
    if (this.isClient && this.clientCache) {
      this.clientCache.remove(identifier, storeName);
    }
  }

  async clear(): Promise<void> {
    await this.serverCache.clear();
    if (this.isClient && this.clientCache) {
      this.clientCache.clear();
    }
  }

  subscribeToUpdates(
    identifier: string,
    storeName: string,
    listener: (data: DataValue) => void,
  ): () => void {
    return realTimeSync.subscribe(identifier, storeName, listener);
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
