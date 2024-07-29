import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('repeated-patterns-encryption.log');
const log = createLogger(logStream);

describe('Repeated Patterns in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const password = 'repeated-patterns-test-password';
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle data with repeated patterns', async () => {
    const repeatedData = new TextEncoder().encode('ABCABCABCABCABC');
    const encryptedValue = await encrypt(repeatedData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(repeatedData);
  });

  it('should produce different ciphertexts for identical repeated patterns', async () => {
    const repeatedData = new TextEncoder().encode('XYZXYZXYZXYZXYZ');
    const encryptedValue1 = await encrypt(repeatedData, password, config);
    const encryptedValue2 = await encrypt(repeatedData, password, config);
    expect(encryptedValue1.encryptedData).not.toEqual(encryptedValue2.encryptedData);
  });

  it('should handle large data with repeated patterns', async () => {
    const largeRepeatedData = new TextEncoder().encode('0123456789'.repeat(1000));
    const encryptedValue = await encrypt(largeRepeatedData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(largeRepeatedData);
  });

  it('should handle data with a single repeated byte', async () => {
    const singleByteData = new Uint8Array(1000).fill(65); // ASCII 'A'
    const encryptedValue = await encrypt(singleByteData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(singleByteData);
  });

  it('should handle data with alternating patterns', async () => {
    const alternatingData = new TextEncoder().encode('ABABABABAB'.repeat(100));
    const encryptedValue = await encrypt(alternatingData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(alternatingData);
  });
});
