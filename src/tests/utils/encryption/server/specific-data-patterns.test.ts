import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('specific-data-patterns-encryption.log');
const log = createLogger(logStream);

describe('Specific Data Patterns in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const password = 'specific-data-patterns-test-password';
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle all zero bytes', async () => {
    const allZeroBytes = new Uint8Array(1024).fill(0);

    const encryptedValue = await encrypt(allZeroBytes, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(allZeroBytes);
  });

  it('should handle all one bytes', async () => {
    const allOneBytes = new Uint8Array(1024).fill(1);

    const encryptedValue = await encrypt(allOneBytes, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(allOneBytes);
  });

  it('should handle alternating zero and one bytes', async () => {
    const alternatingBytes = new Uint8Array(1024);
    for (let i = 0; i < alternatingBytes.length; i++) {
      alternatingBytes[i] = i % 2;
    }

    const encryptedValue = await encrypt(alternatingBytes, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(alternatingBytes);
  });

  it('should handle incremental byte values', async () => {
    const incrementalBytes = new Uint8Array(256);
    for (let i = 0; i < incrementalBytes.length; i++) {
      incrementalBytes[i] = i;
    }

    const encryptedValue = await encrypt(incrementalBytes, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(incrementalBytes);
  });

  it('should handle random byte values', async () => {
    const randomBytes = new Uint8Array(1024);
    crypto.getRandomValues(randomBytes);

    const encryptedValue = await encrypt(randomBytes, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(randomBytes);
  });

  it('should handle repeated patterns', async () => {
    const repeatedPattern = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const repeatedPatternData = new Uint8Array(1024);
    for (let i = 0; i < repeatedPatternData.length; i += repeatedPattern.length) {
      repeatedPatternData.set(repeatedPattern, i);
    }

    const encryptedValue = await encrypt(repeatedPatternData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(repeatedPatternData);
  });
});
