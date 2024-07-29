import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('whitespace-handling-encryption.log');
const log = createLogger(logStream);

describe('Whitespace Handling in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const password = 'whitespace-test-password';
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle encryption and decryption of data with various whitespace characters', async () => {
    const testData = 'Space Newline\nTab\tCarriage Return\rForm Feed\f';
    const testUint8Array = encoder.encode(testData);

    const encryptedValue = await encrypt(testUint8Array, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = decoder.decode(decryptedData);

    expect(decryptedString).toEqual(testData);
  });

  it('should handle encryption and decryption of data with leading and trailing whitespace', async () => {
    const testData = '  \n\t  Trimmed content  \t\n  ';
    const testUint8Array = encoder.encode(testData);

    const encryptedValue = await encrypt(testUint8Array, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = decoder.decode(decryptedData);

    expect(decryptedString).toEqual(testData);
  });

  it('should handle encryption and decryption of data with only whitespace', async () => {
    const testData = ' \n\t\r\f ';
    const testUint8Array = encoder.encode(testData);

    const encryptedValue = await encrypt(testUint8Array, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = decoder.decode(decryptedData);

    expect(decryptedString).toEqual(testData);
  });

  it('should handle encryption and decryption of data with Unicode whitespace characters', async () => {
    const testData = 'Non-breaking\u00A0space Ogham\u1680space En\u2002quad Em\u2003quad';
    const testUint8Array = encoder.encode(testData);

    const encryptedValue = await encrypt(testUint8Array, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = decoder.decode(decryptedData);

    expect(decryptedString).toEqual(testData);
  });

  it('should handle encryption and decryption of data with mixed content and whitespace', async () => {
    const testData = 'Line 1\nLine 2\tTabbed\nLine 3  Spaces\nLine 4\rCarriage Return';
    const testUint8Array = encoder.encode(testData);

    const encryptedValue = await encrypt(testUint8Array, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = decoder.decode(decryptedData);

    expect(decryptedString).toEqual(testData);
  });
});
