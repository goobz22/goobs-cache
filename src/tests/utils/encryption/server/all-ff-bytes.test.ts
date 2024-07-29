import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('all-ff-bytes-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of All 0xFF Bytes', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testAllFFBytes = async (size: number): Promise<void> => {
    const allFFBytes = new Uint8Array(size).fill(0xff);
    const password = 'testPassword123';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(allFFBytes, password, config);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.type).toBe('encrypted');
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(size);

    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toBeInstanceOf(Uint8Array);
    expect(decryptedData).toEqual(allFFBytes);
  };

  it('should encrypt and decrypt 1KB of 0xFF bytes', async () => {
    await expect(testAllFFBytes(1024)).resolves.not.toThrow();
  });

  it('should encrypt and decrypt 1MB of 0xFF bytes', async () => {
    await expect(testAllFFBytes(1024 * 1024)).resolves.not.toThrow();
  });

  it('should encrypt and decrypt 10MB of 0xFF bytes', async () => {
    await expect(testAllFFBytes(10 * 1024 * 1024)).resolves.not.toThrow();
  });

  it('should produce different encrypted values for the same 0xFF input', async () => {
    const allFFBytes = new Uint8Array(1024).fill(0xff);
    const password = 'testPassword123';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue1 = await encrypt(allFFBytes, password, config);
    const encryptedValue2 = await encrypt(allFFBytes, password, config);

    expect(encryptedValue1.encryptedData).not.toEqual(encryptedValue2.encryptedData);
    expect(encryptedValue1.iv).not.toEqual(encryptedValue2.iv);
    expect(encryptedValue1.salt).not.toEqual(encryptedValue2.salt);
  });
});
