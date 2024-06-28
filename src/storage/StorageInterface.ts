import { EncryptedValue } from '../types/DataTypes';

/**
 * CacheItem interface represents a single item stored in the cache.
 * It contains the value of the item, the timestamp of its last access,
 * and the expiration date.
 */
export interface CacheItem<T> {
  value: T;
  lastAccessed: number;
  expirationDate: Date;
}

/**
 * StorageInterface defines the methods that a storage implementation should provide.
 * It includes methods for retrieving, setting, removing, and clearing cache items.
 */
export interface StorageInterface {
  /**
   * get method retrieves a cache item from the storage using the provided key.
   * @param key The key of the cache item to retrieve.
   * @returns A Promise that resolves to the cache item if found, or undefined if not found.
   */
  get(key: string): Promise<CacheItem<EncryptedValue> | undefined>;

  /**
   * set method sets a cache item in the storage using the provided key and item.
   * @param key The key of the cache item to set.
   * @param item The cache item to set.
   */
  set(key: string, item: CacheItem<EncryptedValue>): Promise<void>;

  /**
   * remove method removes a cache item from the storage using the provided key.
   * @param key The key of the cache item to remove.
   */
  remove(key: string): Promise<void>;

  /**
   * clear method removes all cache items from the storage.
   */
  clear(): Promise<void>;
}
