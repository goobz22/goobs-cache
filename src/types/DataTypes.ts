/**
 * StringValue interface represents a string value.
 */
export interface StringValue {
  type: 'string';
  value: string;
}

/**
 * ListValue interface represents a list of string values.
 */
export interface ListValue {
  type: 'list';
  value: string[];
}

/**
 * SetValue interface represents a set of string values.
 */
export interface SetValue {
  type: 'set';
  value: string[];
}

/**
 * HashValue interface represents a hash map of string keys and string values.
 */
export interface HashValue {
  type: 'hash';
  value: Record<string, string>;
}

/**
 * StreamValue interface represents a stream of data.
 * It contains an array of objects, each with an id and a set of fields.
 */
export interface StreamValue {
  type: 'stream';
  value: Array<{ id: string; fields: Record<string, string> }>;
}

/**
 * ZSetValue interface represents a sorted set of string keys and numeric scores.
 */
export interface ZSetValue {
  type: 'zset';
  value: Record<string, number>;
}

/**
 * HLLValue interface represents a HyperLogLog data structure.
 * It contains an array of string values.
 */
export interface HLLValue {
  type: 'hll';
  value: string[];
}

/**
 * GeoValue interface represents geospatial data.
 * It contains a mapping of string keys to geographic coordinates (latitude, longitude).
 */
export interface GeoValue {
  type: 'geo';
  value: Record<string, [number, number]>;
}

/**
 * DataValue type represents the possible data values.
 * It can be one of the following types: StringValue, ListValue, SetValue, HashValue,
 * StreamValue, ZSetValue, HLLValue, or GeoValue.
 */
export type DataValue =
  | StringValue
  | ListValue
  | SetValue
  | HashValue
  | StreamValue
  | ZSetValue
  | HLLValue
  | GeoValue;

/**
 * EncryptedValue interface represents an encrypted data value.
 * It contains the encrypted data, the authentication tag, the key ID used for encryption,
 * and the type of the original data value.
 */
export interface EncryptedValue {
  encryptedData: string;
  authTag: string;
  keyId: number;
  type: DataValue['type'];
}
