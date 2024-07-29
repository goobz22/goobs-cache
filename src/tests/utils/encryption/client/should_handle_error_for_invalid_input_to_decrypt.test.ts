import { decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('invalid-input-decrypt.log');
const log = createLogger(logStream);

describe('Error Handling for Invalid Input to Decrypt', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const decryptPromise = (
    encryptedValue: EncryptedValue,
    config: CacheConfig,
  ): Promise<Uint8Array | null> => {
    return new Promise((resolve) => {
      decrypt(encryptedValue, config, resolve);
    });
  };

  it('should handle null input', async () => {
    const result = await decryptPromise(null as unknown as EncryptedValue, mockCacheConfig);
    expect(result).toBeNull();
  });

  it('should handle undefined input', async () => {
    const result = await decryptPromise(undefined as unknown as EncryptedValue, mockCacheConfig);
    expect(result).toBeNull();
  });

  it('should handle invalid EncryptedValue structure', async () => {
    const invalidEncryptedValue: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array(0),
      iv: new Uint8Array(0),
      salt: new Uint8Array(0),
      authTag: new Uint8Array(0),
      encryptionKey: new Uint8Array(0),
    };
    const result = await decryptPromise(invalidEncryptedValue, mockCacheConfig);
    expect(result).toBeNull();
  });

  it('should handle EncryptedValue with missing properties', async () => {
    const incompleteEncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array(10),
    } as unknown as EncryptedValue;
    const result = await decryptPromise(incompleteEncryptedValue, mockCacheConfig);
    expect(result).toBeNull();
  });

  it('should handle EncryptedValue with invalid property types', async () => {
    const invalidTypeEncryptedValue = {
      type: 'encrypted',
      encryptedData: 'not a Uint8Array',
      iv: 'not a Uint8Array',
      salt: 'not a Uint8Array',
      authTag: 'not a Uint8Array',
      encryptionKey: 'not a Uint8Array',
    } as unknown as EncryptedValue;
    const result = await decryptPromise(invalidTypeEncryptedValue, mockCacheConfig);
    expect(result).toBeNull();
  });

  it('should handle EncryptedValue with empty Uint8Arrays', async () => {
    const emptyArraysEncryptedValue: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array(0),
      iv: new Uint8Array(0),
      salt: new Uint8Array(0),
      authTag: new Uint8Array(0),
      encryptionKey: new Uint8Array(0),
    };
    const result = await decryptPromise(emptyArraysEncryptedValue, mockCacheConfig);
    expect(result).toBeNull();
  });

  it('should handle EncryptedValue with incorrect type', async () => {
    const incorrectTypeEncryptedValue = {
      type: 'not encrypted',
      encryptedData: new Uint8Array(10),
      iv: new Uint8Array(12),
      salt: new Uint8Array(16),
      authTag: new Uint8Array(16),
      encryptionKey: new Uint8Array(32),
    } as unknown as EncryptedValue;
    const result = await decryptPromise(incorrectTypeEncryptedValue, mockCacheConfig);
    expect(result).toBeNull();
  });
});
