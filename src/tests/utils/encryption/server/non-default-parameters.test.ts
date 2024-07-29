import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('non-default-parameters-encryption.log');
const log = createLogger(logStream);

describe('Non-Default Parameters in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testData = new TextEncoder().encode('Test data for non-default parameters');
  const password = 'non-default-parameters-test-password';

  it('should handle non-default algorithm', async () => {
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-192-ccm' };
    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should handle non-default key size', async () => {
    const config: CacheConfig = { ...mockCacheConfig, keySize: 192 };
    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should handle non-default batch size', async () => {
    const config: CacheConfig = { ...mockCacheConfig, batchSize: 20 };
    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should handle non-default auto-tune interval', async () => {
    const config: CacheConfig = { ...mockCacheConfig, autoTuneInterval: 7200000 };
    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should handle non-default key check interval', async () => {
    const config: CacheConfig = { ...mockCacheConfig, keyCheckIntervalMs: 7200000 };
    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should handle non-default key rotation interval', async () => {
    const config: CacheConfig = { ...mockCacheConfig, keyRotationIntervalMs: 172800000 };
    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(testData);
  });
});
