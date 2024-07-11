export type Listener = () => void;

export type Selector<T> = (state: T) => any;

export type AtomGetter<T> = () => T;

export type AtomSetter<T> = (value: T | ((prev: T) => T)) => void;

export type ComplexValue = { [key: string]: any } | any[];

export interface CacheItem<T> {
  value: T;
  lastAccessed: number;
  expirationDate: Date;
  hitCount: number;
  compressed: boolean;
  size: number;
}

export interface StorageInterface {
  get(key: string): Promise<CacheItem<EncryptedValue> | undefined>;
  set(key: string, item: CacheItem<EncryptedValue>): Promise<void>;
  remove(key: string): Promise<void>;
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

export interface JSONValue {
  type: 'json';
  value: any;
}

export type PrimitiveValue = string | number | boolean | null | undefined;

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
  key: string;
  get: () => T;
  set: (value: T | ((prev: T) => T)) => void;
  subscribe: (listener: Listener) => () => void;
}

export interface DerivedAtom<T> extends Atom<T> {
  deps: Atom<any>[];
}

export interface AtomOptions<T> {
  default: T;
  validate?: (value: T) => T;
  onSet?: (newValue: T, oldValue: T) => void;
}

export interface BatchWriterImplementation {
  add(key: string, value: EncryptedValue, expirationDate: Date): Promise<void>;
  flush(): Promise<void>;
  stop(): Promise<void>;
}

export interface AccessTrackerImplementation {
  recordAccess(key: string, relatedKey?: string): Promise<void>;
  getFrequentKeys(threshold: number): Promise<string[]>;
  getPredictedNextKeys(key: string): Promise<string[]>;
}

export interface Context<T> {
  key: string;
  Provider: ContextProvider<T>;
  Consumer: (props: { children: (value: T) => React.ReactNode }) => React.ReactNode;
}

export interface AsyncContext<T> {
  key: string;
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

export type UseStateHook<T> = [T, (value: T | ((prev: T) => T)) => void];

export type UseAsyncContextHook<T> = () => Promise<T>;
