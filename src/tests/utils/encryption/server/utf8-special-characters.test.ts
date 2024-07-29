import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('utf8-special-characters-encryption.log');
const log = createLogger(logStream);

describe('UTF-8 Special Characters in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const password = 'utf8-special-chars-test-password';
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle encryption and decryption of data with UTF-8 special characters', async () => {
    const testData =
      '¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';
    const testUint8Array = encoder.encode(testData);

    const encryptedValue = await encrypt(testUint8Array, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = decoder.decode(decryptedData);

    expect(decryptedString).toEqual(testData);
  });

  it('should handle encryption and decryption of data with UTF-8 control characters', async () => {
    const testData =
      '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F';
    const testUint8Array = encoder.encode(testData);

    const encryptedValue = await encrypt(testUint8Array, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = decoder.decode(decryptedData);

    expect(decryptedString).toEqual(testData);
  });

  it('should handle encryption and decryption of data with UTF-8 multi-byte characters', async () => {
    const testData = '你好世界こんにちは세계안녕하세요';
    const testUint8Array = encoder.encode(testData);

    const encryptedValue = await encrypt(testUint8Array, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = decoder.decode(decryptedData);

    expect(decryptedString).toEqual(testData);
  });

  it('should handle encryption and decryption of data with UTF-8 emojis', async () => {
    const testData =
      '😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁☹️😣😖';
    const testUint8Array = encoder.encode(testData);

    const encryptedValue = await encrypt(testUint8Array, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = decoder.decode(decryptedData);

    expect(decryptedString).toEqual(testData);
  });

  it('should handle encryption and decryption of data with mixed UTF-8 characters', async () => {
    const testData =
      'Hello, 世界! 👋 This is a mix of ASCII, UTF-8, and emojis. ¡Hola! こんにちは 😊';
    const testUint8Array = encoder.encode(testData);

    const encryptedValue = await encrypt(testUint8Array, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = decoder.decode(decryptedData);

    expect(decryptedString).toEqual(testData);
  });
});
