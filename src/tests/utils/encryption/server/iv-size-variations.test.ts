import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig, EncryptedValue } from '../../../../types';

const logStream: WriteStream = createLogStream('iv-size-variations-encryption.log');
const log = createLogger(logStream);

describe('IV Size Variations in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testIVSize = async (ivSize: number): Promise<void> => {
    const data = new TextEncoder().encode('Test data for IV size variation');
    const password = 'iv-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptedValue = await encrypt(data, password, config);
    const modifiedEncryptedValue: EncryptedValue = {
      ...encryptedValue,
      iv: new Uint8Array(ivSize),
    };
    await expect(decrypt(modifiedEncryptedValue, password, config)).rejects.toThrow();
  };

  it('should reject IV size of 8 bytes', async () => {
    await expect(testIVSize(8)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should reject IV size of 12 bytes', async () => {
    await expect(testIVSize(12)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should accept IV size of 16 bytes', async () => {
    const data = new TextEncoder().encode('Test data for 16-byte IV');
    const password = 'iv-16-byte-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptedValue = await encrypt(data, password, config);
    expect(encryptedValue.iv.byteLength).toBe(16);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(data);
  });

  it('should reject IV size of 20 bytes', async () => {
    await expect(testIVSize(20)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should reject IV size of 24 bytes', async () => {
    await expect(testIVSize(24)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should reject IV size of 32 bytes', async () => {
    await expect(testIVSize(32)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should reject empty IV', async () => {
    await expect(testIVSize(0)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should reject very large IV size', async () => {
    await expect(testIVSize(1024)).resolves.not.toThrow();
    expect.assertions(1);
  });

  it('should use different IVs for each encryption', async () => {
    const data = new TextEncoder().encode('Test data for IV uniqueness');
    const password = 'iv-uniqueness-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptionCount = 100;
    const ivs: Uint8Array[] = [];
    for (let i = 0; i < encryptionCount; i++) {
      const encryptedValue = await encrypt(data, password, config);
      ivs.push(encryptedValue.iv);
    }
    const uniqueIVs = new Set(ivs.map((iv) => iv.toString()));
    expect(uniqueIVs.size).toBe(encryptionCount);
  });
});
