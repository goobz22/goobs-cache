import { CacheConfig, CacheResult, DataValue } from '../types';

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

export class TwoLayerServerCache {
  private serverStorage: ServerStorage;

  constructor(config: CacheConfig, serverStorage: ServerStorage) {
    this.serverStorage = serverStorage;
  }

  async get(identifier: string, storeName: string): Promise<CacheResult> {
    return this.serverStorage.get(identifier, storeName);
  }

  async set(
    identifier: string,
    storeName: string,
    value: DataValue,
    expirationDate: Date,
  ): Promise<void> {
    await this.serverStorage.set(identifier, storeName, value, expirationDate);
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    await this.serverStorage.remove(identifier, storeName);
  }

  async clear(): Promise<void> {
    await this.serverStorage.clear();
  }

  subscribeToUpdates<T extends DataValue>(
    identifier: string,
    storeName: string,
    listener: (data: T) => void,
  ): () => void {
    return this.serverStorage.subscribeToUpdates(identifier, storeName, listener);
  }
}
