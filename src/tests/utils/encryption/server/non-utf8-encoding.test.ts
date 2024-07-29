import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('non-utf8-encoding-encryption.log');
const log = createLogger(logStream);

describe('Non-UTF8 Encoding in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const password = 'non-utf8-encoding-test-password';
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle non-UTF8 encoded data', async () => {
    const originalData = new Uint8Array([0xc3, 0xa9, 0xc3, 0xa0, 0xc3, 0xa8]); // é à è in UTF-8

    const encryptedValue = await encrypt(originalData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(originalData);
  });

  it('should preserve byte integrity for non-UTF8 data', async () => {
    const originalData = new Uint8Array([0xff, 0xfe, 0xfd, 0xfc, 0xfb, 0xfa]);

    const encryptedValue = await encrypt(originalData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(originalData);
  });

  it('should handle mixed UTF-8 and non-UTF8 data', async () => {
    const originalData = new Uint8Array([
      0x48,
      0x65,
      0x6c,
      0x6c,
      0x6f, // "Hello" in ASCII
      0xc3,
      0xa9, // é in UTF-8
      0xff,
      0xfe, // Invalid UTF-8 bytes
      0x77,
      0x6f,
      0x72,
      0x6c,
      0x64, // "world" in ASCII
    ]);

    const encryptedValue = await encrypt(originalData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(originalData);
  });

  it('should encrypt and decrypt large non-UTF8 data', async () => {
    const originalData = new Uint8Array(1024).map(() => Math.floor(Math.random() * 256));

    const encryptedValue = await encrypt(originalData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(originalData);
  });

  it('should handle empty input', async () => {
    const originalData = new Uint8Array(0);

    const encryptedValue = await encrypt(originalData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(originalData);
  });
});
