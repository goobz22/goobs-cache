import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('null-bytes-encryption.log');
const log = createLogger(logStream);

describe('Null Bytes in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const password = 'null-bytes-test-password';
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle data with null bytes', async () => {
    const data = new Uint8Array([0, 1, 2, 0, 3, 4, 0]);
    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(data);
  });

  it('should handle data starting with null bytes', async () => {
    const data = new Uint8Array([0, 0, 0, 1, 2, 3]);
    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(data);
  });

  it('should handle data ending with null bytes', async () => {
    const data = new Uint8Array([1, 2, 3, 0, 0, 0]);
    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(data);
  });

  it('should handle data with only null bytes', async () => {
    const data = new Uint8Array([0, 0, 0, 0, 0]);
    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(data);
  });

  it('should handle large data with null bytes', async () => {
    const data = new Uint8Array(1024).fill(0);
    data[512] = 1;
    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(data);
  });
});
