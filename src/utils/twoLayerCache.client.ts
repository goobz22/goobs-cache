import { CacheConfig, CacheResult, DataValue } from '../types';

export interface ClientStorage {
  get(
    identifier: string,
    storeName: string,
    callback: (result: CacheResult | undefined) => void,
  ): void;
  set(identifier: string, storeName: string, value: DataValue, expirationDate: Date): void;
  remove(identifier: string, storeName: string): void;
  clear(): void;
}

export interface ServerStorage {
  get(identifier: string, storeName: string): Promise<CacheResult>;
  set(identifier: string, storeName: string, value: DataValue, expirationDate: Date): Promise<void>;
  remove(identifier: string, storeName: string): Promise<void>;
  clear(): Promise<void>;
  subscribeToUpdates<T extends DataValue>(
    identifier: string,
    storeName: string,
    listener: (data: T) => void,
  ): () => void;
}

export class TwoLayerClientCache {
  private serverCache: ServerStorage;
  private clientStorage: ClientStorage;

  constructor(config: CacheConfig, clientStorage: ClientStorage, serverCache: ServerStorage) {
    this.serverCache = serverCache;
    this.clientStorage = clientStorage;
  }

  get(
    identifier: string,
    storeName: string,
    callback: (result: CacheResult | undefined) => void,
  ): void {
    // First, try to get from client storage
    this.clientStorage.get(identifier, storeName, (clientStorageResult) => {
      if (clientStorageResult && clientStorageResult.value !== undefined) {
        callback(clientStorageResult);
      } else {
        // If not in client storage, fetch from ServerCache
        this.serverCache.get(identifier, storeName).then((serverCacheResult) => {
          if (serverCacheResult.value !== undefined) {
            // Store the result in client storage for future use
            this.clientStorage.set(
              identifier,
              storeName,
              serverCacheResult.value,
              serverCacheResult.expirationDate,
            );
          }
          callback(serverCacheResult);
        });
      }
    });
  }

  set(identifier: string, storeName: string, value: DataValue, expirationDate: Date): void {
    // Set in client storage immediately
    this.clientStorage.set(identifier, storeName, value, expirationDate);

    // Set in ServerCache asynchronously
    this.serverCache.set(identifier, storeName, value, expirationDate);
  }

  remove(identifier: string, storeName: string): void {
    // Remove from client storage immediately
    this.clientStorage.remove(identifier, storeName);

    // Remove from ServerCache asynchronously
    this.serverCache.remove(identifier, storeName);
  }

  clear(): void {
    // Clear client storage immediately
    this.clientStorage.clear();

    // Clear ServerCache asynchronously
    this.serverCache.clear();
  }

  subscribeToUpdates<T extends DataValue>(
    identifier: string,
    storeName: string,
    listener: (data: T) => void,
  ): () => void {
    // Subscribe to updates from ServerCache
    return this.serverCache.subscribeToUpdates(identifier, storeName, (data: T) => {
      // Update client storage when ServerCache is updated
      this.clientStorage.set(
        identifier,
        storeName,
        data,
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      ); // Set expiration to 24 hours from now
      listener(data);
    });
  }
}
