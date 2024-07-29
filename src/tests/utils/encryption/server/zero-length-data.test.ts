import { encrypt, decrypt } from '../../../../utils/encryption.server';
import { createLogStream, createLogger, mockCacheConfig } from '../../../jest/default/logging';
import { CacheConfig } from '../../../../types';

const logStream = createLogStream('zero-length-data-test.log');
const log = createLogger(logStream);

describe('Encryption Server Utilities - Zero-Length Data', () => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  afterAll(() => {
    logStream.end();
  });

  it('should handle encryption and decryption of zero-length data', async () => {
    log('\nTesting encryption and decryption of zero-length data...');
    const testData = '';
    const testUint8Array = encoder.encode(testData);

    const config: CacheConfig = { ...mockCacheConfig, encryptionPassword: 'testPassword' };

    const encryptedValue = await encrypt(testUint8Array, config.encryptionPassword, config);
    log(`Encrypted data length: ${encryptedValue.encryptedData.length}`);

    const decryptedData = await decrypt(encryptedValue, config.encryptionPassword, config);
    const decryptedString = decoder.decode(decryptedData);
    log(`Decrypted data length: ${decryptedString.length}`);
    expect(decryptedString).toEqual(testData);
  });

  it('should handle encryption and decryption of zero-length Uint8Array', async () => {
    log('\nTesting encryption and decryption of zero-length Uint8Array...');
    const testUint8Array = new Uint8Array(0);

    const config: CacheConfig = { ...mockCacheConfig, encryptionPassword: 'testPassword' };

    const encryptedValue = await encrypt(testUint8Array, config.encryptionPassword, config);
    log(`Encrypted data length: ${encryptedValue.encryptedData.length}`);

    const decryptedData = await decrypt(encryptedValue, config.encryptionPassword, config);
    log(`Decrypted data length: ${decryptedData.length}`);
    expect(decryptedData.length).toEqual(0);
    expect(decryptedData).toEqual(testUint8Array);
  });

  it('should return consistent results for multiple encryptions of zero-length data', async () => {
    log('\nTesting multiple encryptions of zero-length data...');
    const testData = '';
    const testUint8Array = encoder.encode(testData);

    const config: CacheConfig = { ...mockCacheConfig, encryptionPassword: 'testPassword' };

    const encryptedValue1 = await encrypt(testUint8Array, config.encryptionPassword, config);
    const encryptedValue2 = await encrypt(testUint8Array, config.encryptionPassword, config);
    const encryptedValue3 = await encrypt(testUint8Array, config.encryptionPassword, config);

    log(`Encrypted data 1 length: ${encryptedValue1.encryptedData.length}`);
    log(`Encrypted data 2 length: ${encryptedValue2.encryptedData.length}`);
    log(`Encrypted data 3 length: ${encryptedValue3.encryptedData.length}`);

    expect(encryptedValue1.encryptedData.length).toEqual(encryptedValue2.encryptedData.length);
    expect(encryptedValue2.encryptedData.length).toEqual(encryptedValue3.encryptedData.length);

    const decryptedData1 = await decrypt(encryptedValue1, config.encryptionPassword, config);
    const decryptedData2 = await decrypt(encryptedValue2, config.encryptionPassword, config);
    const decryptedData3 = await decrypt(encryptedValue3, config.encryptionPassword, config);

    const decryptedString1 = decoder.decode(decryptedData1);
    const decryptedString2 = decoder.decode(decryptedData2);
    const decryptedString3 = decoder.decode(decryptedData3);

    log(`Decrypted data 1 length: ${decryptedString1.length}`);
    log(`Decrypted data 2 length: ${decryptedString2.length}`);
    log(`Decrypted data 3 length: ${decryptedString3.length}`);

    expect(decryptedString1).toEqual(testData);
    expect(decryptedString2).toEqual(testData);
    expect(decryptedString3).toEqual(testData);
  });

  it('should handle encryption and decryption of data immediately following zero-length data', async () => {
    log('\nTesting encryption and decryption of data immediately following zero-length data...');
    const emptyData = '';
    const testData = 'Test data';
    const emptyUint8Array = encoder.encode(emptyData);
    const testUint8Array = encoder.encode(testData);

    const config: CacheConfig = { ...mockCacheConfig, encryptionPassword: 'testPassword' };

    await encrypt(emptyUint8Array, config.encryptionPassword, config);

    const encryptedValue = await encrypt(testUint8Array, config.encryptionPassword, config);
    log(`Encrypted data length: ${encryptedValue.encryptedData.length}`);

    const decryptedData = await decrypt(encryptedValue, config.encryptionPassword, config);
    const decryptedString = decoder.decode(decryptedData);
    log(`Decrypted data: ${decryptedString}`);
    expect(decryptedString).toEqual(testData);
  });
});
