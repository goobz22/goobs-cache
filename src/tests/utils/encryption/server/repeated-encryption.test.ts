import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig, EncryptedValue } from '../../../../types';

const logStream: WriteStream = createLogStream('repeated-encryption.log');
const log = createLogger(logStream);

describe('Repeated Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testData = new TextEncoder().encode('Test data for repeated encryption');
  const password = 'repeated-encryption-test-password';
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should produce different ciphertexts for repeated encryptions', async () => {
    const encryptedValue1 = await encrypt(testData, password, config);
    const encryptedValue2 = await encrypt(testData, password, config);
    expect(encryptedValue1.encryptedData).not.toEqual(encryptedValue2.encryptedData);
  });

  it('should correctly decrypt after multiple encryptions', async () => {
    const encryptedValue1 = await encrypt(testData, password, config);
    const encryptedValue2 = await encrypt(encryptedValue1.encryptedData, password, config);
    const encryptedValue3 = await encrypt(encryptedValue2.encryptedData, password, config);

    const decryptedData3 = await decrypt(encryptedValue3, password, config);
    const decryptedData2 = await decrypt(
      { ...encryptedValue2, encryptedData: decryptedData3 },
      password,
      config,
    );
    const decryptedData1 = await decrypt(
      { ...encryptedValue1, encryptedData: decryptedData2 },
      password,
      config,
    );

    expect(decryptedData1).toEqual(testData);
  });

  it('should handle multiple rounds of encryption and decryption', async () => {
    let currentData = testData;
    let currentEncryptedValue: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array(),
      iv: new Uint8Array(),
      salt: new Uint8Array(),
      authTag: new Uint8Array(),
      encryptionKey: new Uint8Array(),
    };
    const rounds = 10;

    for (let i = 0; i < rounds; i++) {
      currentEncryptedValue = await encrypt(currentData, password, config);
      currentData = currentEncryptedValue.encryptedData;
    }

    for (let i = 0; i < rounds; i++) {
      const decryptedValue = await decrypt(currentEncryptedValue, password, config);
      currentData = decryptedValue;
      currentEncryptedValue = {
        ...currentEncryptedValue,
        encryptedData: currentData,
      };
    }

    expect(currentData).toEqual(testData);
  });

  it('should maintain data integrity after repeated encryption and decryption', async () => {
    const rounds = 5;
    let encryptedValue = await encrypt(testData, password, config);

    for (let i = 0; i < rounds; i++) {
      const decryptedData = await decrypt(encryptedValue, password, config);
      encryptedValue = await encrypt(decryptedData, password, config);
    }

    const finalDecryptedData = await decrypt(encryptedValue, password, config);
    expect(finalDecryptedData).toEqual(testData);
  });
});
