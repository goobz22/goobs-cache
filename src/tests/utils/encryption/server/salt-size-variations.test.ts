import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig, EncryptedValue } from '../../../../types';

const logStream: WriteStream = createLogStream('salt-size-variations-encryption.log');
const log = createLogger(logStream);

describe('Salt Size Variations in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testSaltSize = async (saltSize: number): Promise<void> => {
    const data = new TextEncoder().encode('Test data for salt size variation');
    const password = 'salt-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptedValue = await encrypt(data, password, config);
    const modifiedEncryptedValue: EncryptedValue = {
      ...encryptedValue,
      salt: new Uint8Array(saltSize),
    };
    await expect(decrypt(modifiedEncryptedValue, password, config)).rejects.toThrow();
  };

  it('should reject salt size of 8 bytes', async () => {
    await expect(testSaltSize(8)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should reject salt size of 12 bytes', async () => {
    await expect(testSaltSize(12)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should accept salt size of 16 bytes', async () => {
    const data = new TextEncoder().encode('Test data for 16-byte salt');
    const password = 'salt-16-byte-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptedValue = await encrypt(data, password, config);
    expect(encryptedValue.salt.byteLength).toBe(16);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(data);
  });

  it('should reject salt size of 20 bytes', async () => {
    await expect(testSaltSize(20)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should reject salt size of 24 bytes', async () => {
    await expect(testSaltSize(24)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should reject salt size of 32 bytes', async () => {
    await expect(testSaltSize(32)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should reject empty salt', async () => {
    await expect(testSaltSize(0)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should reject very large salt size', async () => {
    await expect(testSaltSize(1024)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should use different salts for each encryption', async () => {
    const data = new TextEncoder().encode('Test data for salt uniqueness');
    const password = 'salt-uniqueness-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptionCount = 100;
    const salts: Uint8Array[] = [];
    for (let i = 0; i < encryptionCount; i++) {
      const encryptedValue = await encrypt(data, password, config);
      salts.push(encryptedValue.salt);
    }
    const uniqueSalts = new Set(salts.map((salt) => salt.toString()));
    expect(uniqueSalts.size).toBe(encryptionCount);
  });
});
