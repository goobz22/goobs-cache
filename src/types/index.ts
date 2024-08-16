import { EncryptionConfig, EncryptedValue } from 'goobs-encryption';

export type ComplexValue =
  | { [key: string]: ComplexValue }
  | ComplexValue[]
  | string
  | number
  | boolean
  | null
  | undefined
  | Buffer;

export interface CacheResult {
  identifier: string;
  storeName: string;
  value: DataValue;
  expirationDate: Date;
  lastUpdatedDate: Date;
  lastAccessedDate: Date;
  getHitCount: number;
  setHitCount: number;
}

export interface StorageInterface {
  get(identifier: string, storeName: string): Promise<CacheResult[] | undefined>;
  set(identifier: string, storeName: string, items: CacheResult[]): Promise<void>;
  remove(identifier: string, storeName: string): Promise<void>;
  clear(): Promise<void>;
  setEvictionPolicy(policy: EvictionPolicy): Promise<void>;
}

export type EvictionPolicy = 'lru' | 'lfu' | 'adaptive';

export interface StringValue {
  type: 'string';
  value: string;
}

export interface NumberValue {
  type: 'number';
  value: number;
}

export interface BooleanValue {
  type: 'boolean';
  value: boolean;
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

export type JSONArray = Array<JSONPrimitive | JSONObject | JSONArray>;

export type DataValue =
  | ComplexValue
  | StringValue
  | NumberValue
  | BooleanValue
  | ListValue
  | SetValue
  | HashValue
  | StreamValue
  | ZSetValue
  | HLLValue
  | GeoValue
  | EncryptedValue
  | JSONValue;

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';

export interface CompressionConfig {
  compressionLevel: number | { level: number };
}

export interface BaseCacheConfig {
  cacheSize: number;
  cacheMaxAge: number;
}

export interface ServerlessCacheConfig extends BaseCacheConfig {
  persistenceInterval: number;
  maxMemoryUsage: number;
  prefetchThreshold?: number;
  forceReset?: boolean;
  evictionPolicy: EvictionPolicy;
  compression: CompressionConfig;
  encryption: EncryptionConfig;
}

export interface SessionCacheConfig extends BaseCacheConfig {
  evictionPolicy: EvictionPolicy;
  compression: CompressionConfig;
  encryption: EncryptionConfig;
}

export interface CookieCacheConfig extends BaseCacheConfig {
  maxCookieSize: number;
  evictionPolicy: EvictionPolicy;
  compression: CompressionConfig;
  encryption: EncryptionConfig;
}

export interface GlobalConfig {
  keySize?: number;
  batchSize?: number;
  autoTuneInterval?: number;
  loggingEnabled: boolean;
  logLevel: LogLevel;
  logDirectory: string;
  initialize: (config: Partial<GlobalConfig>) => void;
}

export type IndividualCacheConfig = ServerlessCacheConfig | SessionCacheConfig | CookieCacheConfig;

export type CacheMode = 'serverless' | 'session' | 'cookie' | 'twoLayer';

export type TwoLayerMode = 'serverless' | 'session' | 'both';
