import React from 'react';

export type Listener = () => void;

export type Selector<T, R = unknown> = (state: T) => R;

export type AtomGetter<T> = () => Promise<T>;

export type AtomSetter<T> = (value: T | ((prev: T) => Promise<T>)) => Promise<void>;

export type PrimitiveValue = string | number | boolean | null | undefined;

export type ComplexValue =
  | { [key: string]: ComplexValue | PrimitiveValue }
  | (ComplexValue | PrimitiveValue)[];

export interface CacheItem<T> {
  value: T;
  lastAccessed: number;
  expirationDate: Date;
  hitCount: number;
  compressed: boolean;
  size: number;
}

export interface StorageInterface {
  get(identifier: string, storeName: string): Promise<CacheItem<EncryptedValue>[] | undefined>;
  set(identifier: string, storeName: string, items: CacheItem<EncryptedValue>[]): Promise<void>;
  remove(identifier: string, storeName: string): Promise<void>;
  clear(): Promise<void>;
  getStatistics(): Promise<CacheStatistics>;
  setEvictionPolicy(policy: EvictionPolicy): Promise<void>;
  autoTune(): Promise<void>;
}

export interface CacheStatistics {
  hitRate: number;
  missRate: number;
  evictionCount: number;
  totalItems: number;
  memoryUsage: number;
  averageAccessTime: number;
  memorySize: number;
}

export type EvictionPolicy = 'lru' | 'lfu' | 'adaptive';

export interface StringValue {
  type: 'string';
  value: string;
}

export interface ListValue {
  type: 'list';
  value: string[];
}

export interface SetValue {
  type: 'set';
  value: string[];
}

export interface HashValue {
  type: 'hash';
  value: Record<string, string>;
}

export interface StreamValue {
  type: 'stream';
  value: Array<{ id: string; fields: Record<string, string> }>;
}

export interface ZSetValue {
  type: 'zset';
  value: Record<string, number>;
}

export interface HLLValue {
  type: 'hll';
  value: string[];
}

export interface GeoValue {
  type: 'geo';
  value: Record<string, [number, number]>;
}

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = {
  type: 'json';
  value: JSONObject | JSONArray;
};
export interface JSONObject {
  [key: string]: JSONPrimitive | JSONObject | JSONArray;
}
export interface JSONArray extends Array<JSONPrimitive | JSONObject | JSONArray> {}

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

export interface EncryptedValue {
  type?: string;
  encryptedData: string;
  iv: string;
  salt: string;
  authTag?: string;
  encryptionKey: string;
}

export interface CompressionOptions {
  level: number;
}

export interface EncryptionOptions {
  algorithm: string;
  keySize: number;
}

export interface CacheConfig {
  cacheSize: number;
  cacheMaxAge: number;
  persistenceInterval: number;
  maxMemoryUsage: number;
  evictionPolicy: EvictionPolicy;
  prefetchThreshold: number;
  compressionLevel: number;
  algorithm: string;
  keySize: number;
  batchSize: number;
  autoTuneInterval: number;
  keyCheckIntervalMs: number;
  keyRotationIntervalMs: number;
  forceReset: boolean;
  encryptionPassword: string;
}

export interface AutoTuneConfig {
  minSize: number;
  maxSize: number;
  tuneInterval: number;
  performanceThreshold: number;
}

export interface Atom<T> {
  identifier: string;
  storeName: string;
  get: () => Promise<T>;
  set: (value: T | ((prev: T) => Promise<T>)) => Promise<void>;
  subscribe: (listener: Listener) => () => void;
}

export interface DerivedAtom<T, D extends readonly Atom<DataValue>[]> extends Atom<T> {
  deps: D;
}

export interface AtomOptions<T> {
  default: T;
  validate?: (value: T) => Promise<T>;
  onSet?: (newValue: T, oldValue: T) => Promise<void>;
}

export interface BatchWriterImplementation {
  add(
    identifier: string,
    storeName: string,
    value: EncryptedValue,
    expirationDate: Date,
  ): Promise<void>;
  flush(): Promise<void>;
  stop(): Promise<void>;
}

export interface AccessTrackerImplementation {
  recordAccess(identifier: string, storeName: string, relatedKey?: string): Promise<void>;
  getFrequentKeys(threshold: number): Promise<Array<{ identifier: string; storeName: string }>>;
  getPredictedNextKeys(
    identifier: string,
    storeName: string,
  ): Promise<Array<{ identifier: string; storeName: string }>>;
}

export interface Context<T> {
  identifier: string;
  storeName: string;
  Provider: ContextProvider<T>;
  Consumer: (props: { children: (value: T) => React.ReactNode }) => React.ReactNode;
}

export interface AsyncContext<T> {
  identifier: string;
  storeName: string;
  Provider: AsyncContextProvider<T>;
  Consumer: (props: { children: (value: T) => React.ReactNode }) => React.ReactNode | null;
}

export type ContextProvider<T> = (props: {
  value?: T;
  children: React.ReactNode;
}) => React.ReactNode;

export type AsyncContextProvider<T> = (props: {
  value?: Promise<T>;
  children: React.ReactNode;
}) => Promise<React.ReactNode>;

export type UseStateHook<T> = [
  T | undefined,
  (value: T | ((prev: T) => Promise<T>)) => Promise<void>,
];

export type UseAsyncContextHook<T> = () => Promise<T>;

export type CacheMode = 'server' | 'client' | 'cookie';

export interface SetOptions {
  identifier: string;
  storeName: string;
  expirationDate?: Date;
  mode: CacheMode;
}

export interface GetOptions {
  identifier: string;
  storeName: string;
  mode: CacheMode;
}

export interface RemoveOptions {
  identifier: string;
  storeName: string;
  mode: CacheMode;
}
