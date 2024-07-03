/**
 * Types.ts
 * This file contains all the type definitions used throughout the goobs-cache system.
 * It combines storage interface types, data value types, and encryption-related types.
 */

/**
 * Listener type represents a function that is called when a value changes.
 * It takes no parameters and returns nothing.
 */
export type Listener = () => void;

/**
 * Selector type represents a function that selects a part of the state.
 * It takes the entire state object and returns a specific part of it.
 * @template T The type of the state object.
 * @param state The state object to select from.
 * @returns The selected part of the state.
 */
export type Selector<T> = (state: T) => any;

/**
 * AtomGetter type represents a function that retrieves the current value of an atom.
 * It takes an Atom object and returns its current value.
 * @template T The type of the atom's value.
 * @param atom The Atom object to get the value from.
 * @returns The current value of the atom.
 */
export type AtomGetter = <T>(atom: Atom<T>) => T;

/**
 * AtomSetter type represents a function that sets a new value for an atom.
 * It takes an Atom object and a new value (or a function that produces a new value based on the previous one).
 * @template T The type of the atom's value.
 * @param atom The Atom object to set the value for.
 * @param value The new value to set, or a function that takes the previous value and returns a new value.
 */
export type AtomSetter = <T>(atom: Atom<T>, value: T | ((prev: T) => T)) => void;

/**
 * ComplexValue type represents complex data structures that can be stored in the cache.
 * It can either be an object with string keys and any values, or an array of any type.
 */
export type ComplexValue =
  | { [key: string]: any } // This allows for any object structure
  | any[]; // This allows for any array type

/**
 * CacheItem interface represents a single item stored in the cache.
 * It contains the value of the item, metadata about its usage and expiration,
 * and information about its storage characteristics.
 * @template T The type of the value stored in the cache item.
 */
export interface CacheItem<T> {
  /** The actual value stored in the cache */
  value: T;
  /** Timestamp of the last access to this item */
  lastAccessed: number;
  /** Date when this item should expire and be removed from the cache */
  expirationDate: Date;
  /** Number of times this item has been accessed */
  hitCount: number;
  /** Indicates whether the value is stored in a compressed format */
  compressed: boolean;
  /** Size of the item in bytes */
  size: number;
}

/**
 * StorageInterface defines the methods that a storage implementation should provide.
 * It includes methods for retrieving, setting, removing, and clearing cache items,
 * as well as methods for managing and monitoring the cache.
 */
export interface StorageInterface {
  /**
   * get method retrieves a cache item by its key.
   * @param key The key of the item to retrieve.
   * @returns A Promise that resolves to the cache item if found, or undefined if not found.
   */
  get(key: string): Promise<CacheItem<EncryptedValue> | undefined>;

  /**
   * set method stores a cache item with a given key.
   * @param key The key to store the item under.
   * @param item The cache item to store.
   * @returns A Promise that resolves when the item has been stored.
   */
  set(key: string, item: CacheItem<EncryptedValue>): Promise<void>;

  /**
   * remove method removes a cache item by its key.
   * @param key The key of the item to remove.
   * @returns A Promise that resolves when the item has been removed.
   */
  remove(key: string): Promise<void>;

  /**
   * clear method removes all items from the cache.
   * @returns A Promise that resolves when the cache has been cleared.
   */
  clear(): Promise<void>;

  /**
   * getStatistics method retrieves statistics about the cache's performance.
   * @returns A Promise that resolves to a CacheStatistics object.
   */
  getStatistics(): Promise<CacheStatistics>;

  /**
   * setEvictionPolicy method sets the eviction policy for the cache.
   * @param policy The eviction policy to use.
   * @returns A Promise that resolves when the policy has been set.
   */
  setEvictionPolicy(policy: EvictionPolicy): Promise<void>;

  /**
   * autoTune method automatically tunes the cache's parameters for optimal performance.
   * @returns A Promise that resolves when the cache has been tuned.
   */
  autoTune(): Promise<void>;
}

/**
 * CacheStatistics interface represents various metrics about the cache's performance.
 */
export interface CacheStatistics {
  /** Ratio of cache hits to total cache accesses */
  hitRate: number;
  /** Ratio of cache misses to total cache accesses */
  missRate: number;
  /** Number of items evicted from the cache */
  evictionCount: number;
  /** Total number of items currently in the cache */
  totalItems: number;
  /** Current memory usage of the cache in bytes */
  memoryUsage: number;
  /** Average time taken to access an item in the cache */
  averageAccessTime: number;
  /** Current size of the memory cache */
  memorySize: number;
}

/**
 * EvictionPolicy type represents the available cache eviction strategies.
 * - 'lru': Least Recently Used, evicts the least recently accessed items first.
 * - 'lfu': Least Frequently Used, evicts the least frequently accessed items first.
 * - 'adaptive': Adapts to usage patterns, combining LRU and LFU strategies.
 */
export type EvictionPolicy = 'lru' | 'lfu' | 'adaptive';

/**
 * StringValue interface represents a string value in the cache.
 */
export interface StringValue {
  type: 'string';
  value: string;
}

/**
 * ListValue interface represents a list of string values in the cache.
 */
export interface ListValue {
  type: 'list';
  value: string[];
}

/**
 * SetValue interface represents a set of string values in the cache.
 */
export interface SetValue {
  type: 'set';
  value: string[];
}

/**
 * HashValue interface represents a hash map of string keys and string values in the cache.
 */
export interface HashValue {
  type: 'hash';
  value: Record<string, string>;
}

/**
 * StreamValue interface represents a stream of data in the cache.
 * It contains an array of objects, each with an id and a set of fields.
 */
export interface StreamValue {
  type: 'stream';
  value: Array<{ id: string; fields: Record<string, string> }>;
}

/**
 * ZSetValue interface represents a sorted set of string keys and numeric scores in the cache.
 */
export interface ZSetValue {
  type: 'zset';
  value: Record<string, number>;
}

/**
 * HLLValue interface represents a HyperLogLog data structure in the cache.
 * It contains an array of string values.
 */
export interface HLLValue {
  type: 'hll';
  value: string[];
}

/**
 * GeoValue interface represents geospatial data in the cache.
 * It contains a mapping of string keys to geographic coordinates (latitude, longitude).
 */
export interface GeoValue {
  type: 'geo';
  value: Record<string, [number, number]>;
}

/**
 * JSONValue interface represents any JSON-serializable data in the cache.
 * It can be used for generic JSON objects or arrays.
 */
export interface JSONValue {
  type: 'json';
  value: any;
}

/**
 * PrimitiveValue type represents the primitive values that can be stored in the cache.
 * It includes string, number, boolean, null, and undefined.
 */
export type PrimitiveValue = string | number | boolean | null | undefined;

/**
 * DataValue type represents all possible values that can be stored in the cache.
 * It includes primitive values, complex values, and specific data structures.
 */
export type DataValue =
  | PrimitiveValue
  | ComplexValue
  | StringValue
  | ListValue
  | SetValue
  | HashValue
  | StreamValue
  | ZSetValue
  | HLLValue
  | GeoValue
  | JSONValue;

/**
 * EncryptedValue interface represents an encrypted data value in the cache.
 * It contains the encrypted data, the initialization vector (IV), the authentication tag,
 * the encryption key, and the type of the original data value.
 */
export interface EncryptedValue {
  /** The encrypted data as a string */
  encryptedData: string;
  /** The initialization vector used in the encryption process */
  iv: string;
  /** The authentication tag generated during encryption */
  authTag: string;
  /** The key used for encryption */
  encryptionKey: string;
  /** The type of the original (unencrypted) data value */
  type: string;
}

/**
 * CompressionOptions interface represents options for data compression.
 */
export interface CompressionOptions {
  /** The compression level to use (typically -1 to 9, where -1 is default, 0 is no compression, and 9 is best compression) */
  level: number;
}

/**
 * EncryptionOptions interface represents options for data encryption.
 */
export interface EncryptionOptions {
  /** The encryption algorithm to use (e.g., 'aes-256-gcm') */
  algorithm: string;
  /** The key size in bits */
  keySize: number;
}

/**
 * CacheConfig interface represents the configuration options for the cache.
 */
export interface CacheConfig {
  /** The size of the cache (number of items it can hold) */
  cacheSize: number;
  /** The maximum age of items in the cache (in milliseconds) before they expire */
  cacheMaxAge: number;
  /** The interval (in milliseconds) at which to persist the cache */
  persistenceInterval: number;
  /** The maximum amount of memory the cache can use (in bytes) */
  maxMemoryUsage: number;
  /** The eviction policy to use when the cache is full */
  evictionPolicy: EvictionPolicy;
  /** The threshold at which to start prefetching items */
  prefetchThreshold: number;
  /** The compression level to use for compressing cache items */
  compressionLevel: number;
  /** The encryption algorithm to use (e.g., 'aes-256-gcm') */
  algorithm: string;
  /** The size of the encryption key in bits */
  keySize: number;
  /** The batch size for batch operations */
  batchSize: number;
  /** The interval (in milliseconds) at which to perform auto-tuning */
  autoTuneInterval: number;
  /** The interval (in milliseconds) at which to check the encryption keys */
  keyCheckIntervalMs: number;
  /** The interval (in milliseconds) at which to rotate the encryption keys */
  keyRotationIntervalMs: number;
  /** Whether to force a reset of the cache on initialization */
  forceReset: boolean;
}

/**
 * AutoTuneConfig interface represents the configuration for the auto-tuning mechanism.
 */
export interface AutoTuneConfig {
  /** The minimum size the cache can be tuned to */
  minSize: number;
  /** The maximum size the cache can be tuned to */
  maxSize: number;
  /** The interval (in milliseconds) at which auto-tuning occurs */
  tuneInterval: number;
  /** The performance threshold that triggers tuning */
  performanceThreshold: number;
}

/**
 * Atom interface represents an atom in the state management system.
 * @template T The type of the value stored in the atom.
 */
export interface Atom<T> {
  /** Unique identifier for the atom */
  key: string;
  /** Function to get the current value of the atom */
  get: () => T;
  /** Function to set a new value for the atom */
  set: (value: T | ((prev: T) => T)) => void;
  /** Function to subscribe to changes in the atom's value */
  subscribe: (listener: Listener) => () => void;
}

/**
 * DerivedAtom interface represents a derived atom in the state management system.
 * It extends the Atom interface with a list of dependencies.
 * @template T The type of the value stored in the derived atom.
 */
export interface DerivedAtom<T> extends Atom<T> {
  /** List of atoms that this derived atom depends on */
  deps: Atom<any>[];
}

/**
 * AtomOptions interface represents options for creating an atom.
 * @template T The type of the value stored in the atom.
 */
export interface AtomOptions<T> {
  /** The initial value of the atom */
  default: T;
  /** Optional function to validate or transform the atom's value when it's set */
  validate?: (value: T) => T;
  /** Optional function to be called when the atom's value changes */
  onSet?: (newValue: T, oldValue: T) => void;
}

/**
 * Enhanced MemoryCacheImplementation interface with advanced features and auto-tuning.
 * @template T The type of the value stored in the cache.
 */
export interface MemoryCacheImplementation<T> {
  /**
   * get method retrieves a value from the cache by its key.
   * @param key The key of the value to retrieve.
   * @returns A Promise that resolves to the value if found, or undefined if not found.
   */
  get(key: string): Promise<T | undefined>;

  /**
   * set method stores a value in the cache with a given key and expiration date.
   * @param key The key to store the value under.
   * @param value The value to store.
   * @param expirationDate The expiration date of the value.
   * @returns A Promise that resolves when the value has been stored.
   */
  set(key: string, value: T, expirationDate: Date): Promise<void>;

  /**
   * delete method removes a value from the cache by its key.
   * @param key The key of the value to remove.
   * @returns A Promise that resolves when the value has been removed.
   */
  delete(key: string): Promise<void>;

  /**
   * clear method removes all values from the cache.
   * @returns A Promise that resolves when the cache has been cleared.
   */
  clear(): Promise<void>;

  /**
   * resize method changes the size of the cache.
   * @param newSize The new size of the cache.
   * @returns A Promise that resolves when the cache has been resized.
   */
  resize(newSize: number): Promise<void>;

  /**
   * setEvictionPolicy method sets the eviction policy for the cache.
   * @param policy The eviction policy to use.
   * @returns A Promise that resolves when the policy has been set.
   */
  setEvictionPolicy(policy: EvictionPolicy): Promise<void>;

  /**
   * getStatistics method retrieves statistics about the cache's performance.
   * @returns A Promise that resolves to a CacheStatistics object.
   */
  getStatistics(): Promise<CacheStatistics>;

  /**
   * autoTune method automatically tunes the cache's parameters for optimal performance.
   * @returns A Promise that resolves when the cache has been tuned.
   */
  autoTune(): Promise<void>;
}

/**
 * TwoLevelCacheImplementation interface defines the methods that a two-level cache
 * implementation should provide.
 */
export interface TwoLevelCacheImplementation {
  /**
   * get method retrieves an encrypted value from the cache by its key.
   * @param key The key of the value to retrieve.
   * @returns A Promise that resolves to the encrypted value if found, or undefined if not found.
   */
  get(key: string): Promise<EncryptedValue | undefined>;

  /**
   * set method stores an encrypted value in the cache with a given key and expiration date.
   * @param key The key to store the value under.
   * @param value The encrypted value to store.
   * @param expirationDate The expiration date of the value.
   * @returns A Promise that resolves when the value has been stored.
   */
  set(key: string, value: EncryptedValue, expirationDate: Date): Promise<void>;

  /**
   * remove method removes a value from the cache by its key.
   * @param key The key of the value to remove.
   * @returns A Promise that resolves when the value has been removed.
   */
  remove(key: string): Promise<void>;

  /**
   * clear method removes all values from the cache.
   * @returns A Promise that resolves when the cache has been cleared.
   */
  clear(): Promise<void>;

  /**
   * resizeCache method changes the size of the cache.
   * @param newSize The new size of the cache.
   * @returns A Promise that resolves when the cache has been resized.
   */
  resizeCache(newSize: number): Promise<void>;

  /**
   * getStatistics method retrieves statistics about the cache's performance.
   * @returns A Promise that resolves to a CacheStatistics object.
   */
  getStatistics(): Promise<CacheStatistics>;

  /**
   * setEvictionPolicy method sets the eviction policy for the cache.
   * @param policy The eviction policy to use.
   * @returns A Promise that resolves when the policy has been set.
   */
  setEvictionPolicy(policy: EvictionPolicy): Promise<void>;

  /**
   * autoTune method automatically tunes the cache's parameters for optimal performance.
   * @returns A Promise that resolves when the cache has been tuned.
   */
  autoTune(): Promise<void>;
}

/**
 * BatchWriterImplementation interface defines the methods that a batch writer implementation should provide.
 * It includes methods for adding items to the batch, flushing the batch, and stopping the writer.
 */
export interface BatchWriterImplementation {
  /**
   * add method adds a key-value pair with an expiration date to the batch.
   * @param key The key of the item to add.
   * @param value The encrypted value of the item to add.
   * @param expirationDate The expiration date of the item.
   */
  add(key: string, value: EncryptedValue, expirationDate: Date): Promise<void>;

  /**
   * flush method flushes the current batch, persisting the items to storage.
   */
  flush(): Promise<void>;

  /**
   * stop method stops the batch writer, flushing any remaining items and clearing the interval.
   */
  stop(): Promise<void>;
}

/**
 * AccessTrackerImplementation interface defines the methods that an access tracker implementation should provide.
 */
export interface AccessTrackerImplementation {
  /**
   * recordAccess method records the access of a key and an optional related key.
   * @param key The key that was accessed.
   * @param relatedKey An optional related key that was accessed along with the main key.
   */
  recordAccess(key: string, relatedKey?: string): Promise<void>;

  /**
   * getFrequentKeys method retrieves the keys that have been accessed more than the specified threshold.
   * @param threshold The minimum access count threshold for a key to be considered frequent.
   * @returns A Promise that resolves to an array of frequent keys.
   */
  getFrequentKeys(threshold: number): Promise<string[]>;

  /**
   * getPredictedNextKeys method retrieves the predicted next keys based on the access patterns of the given key.
   * @param key The key for which to predict the next keys.
   * @returns A Promise that resolves to an array of predicted next keys.
   */
  getPredictedNextKeys(key: string): Promise<string[]>;
}

/**
 * Context interface represents a context in the state management system.
 * @template T The type of the value stored in the context.
 */
export interface Context<T> {
  /** Unique identifier for the context */
  key: string;
  /** The provider component for the context */
  Provider: ContextProvider<T>;
  /** The consumer component for the context */
  Consumer: (props: { children: (value: T) => React.ReactNode }) => React.ReactNode;
}

/**
 * ContextProvider type represents a provider component for a context.
 * @template T The type of the value stored in the context.
 */
export type ContextProvider<T> = (props: {
  value?: T;
  children: React.ReactNode;
}) => React.ReactNode;

/**
 * UseStateHook type represents a useState hook in the state management system.
 * @template T The type of the value stored in the state.
 */
export type UseStateHook<T> = [T, (value: T | ((prev: T) => T)) => void];
