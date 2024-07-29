import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-concurrent-encryption-operations.log');
const log = createLogger(logStream);

describe('Concurrent Encryption Operations', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const encryptPromise = (
    data: Uint8Array,
    config: typeof mockCacheConfig,
  ): Promise<EncryptedValue> => {
    return new Promise((resolve) => {
      encrypt(data, config, resolve);
    });
  };

  const decryptPromise = (
    encryptedValue: EncryptedValue,
    config: typeof mockCacheConfig,
  ): Promise<Uint8Array | null> => {
    return new Promise((resolve) => {
      decrypt(encryptedValue, config, resolve);
    });
  };

  it('should handle multiple concurrent encryption operations', async () => {
    const data1 = 'First piece of data';
    const data2 = 'Second piece of data';
    const data3 = 'Third piece of data';

    log('Starting concurrent encryption operations');

    const [encrypted1, encrypted2, encrypted3] = await Promise.all([
      encryptPromise(new TextEncoder().encode(data1), mockCacheConfig),
      encryptPromise(new TextEncoder().encode(data2), mockCacheConfig),
      encryptPromise(new TextEncoder().encode(data3), mockCacheConfig),
    ]);

    log('All encryption operations completed');

    const [decrypted1, decrypted2, decrypted3] = await Promise.all([
      decryptPromise(encrypted1, mockCacheConfig),
      decryptPromise(encrypted2, mockCacheConfig),
      decryptPromise(encrypted3, mockCacheConfig),
    ]);

    log('All decryption operations completed');

    expect(decrypted1 && new TextDecoder().decode(decrypted1)).toEqual(data1);
    expect(decrypted2 && new TextDecoder().decode(decrypted2)).toEqual(data2);
    expect(decrypted3 && new TextDecoder().decode(decrypted3)).toEqual(data3);

    log('All decrypted data matches original data');
  });

  it('should handle a large number of concurrent encryption operations', async () => {
    const numberOfOperations = 100;
    const baseData = 'Concurrent operation data ';

    log(`Starting ${numberOfOperations} concurrent encryption operations`);

    const encryptionPromises = Array.from({ length: numberOfOperations }, (_, i) =>
      encryptPromise(new TextEncoder().encode(baseData + i), mockCacheConfig),
    );

    const encryptedValues = await Promise.all(encryptionPromises);

    log('All encryption operations completed');

    const decryptionPromises = encryptedValues.map((encryptedValue) =>
      decryptPromise(encryptedValue, mockCacheConfig),
    );

    const decryptedValues = await Promise.all(decryptionPromises);

    log('All decryption operations completed');

    decryptedValues.forEach((decrypted, i) => {
      expect(decrypted && new TextDecoder().decode(decrypted)).toEqual(baseData + i);
    });

    log('All decrypted data matches original data');
  });

  it('should handle concurrent operations with different data sizes', async () => {
    const smallData = 'Small';
    const mediumData = 'Medium'.repeat(100);
    const largeData = 'Large'.repeat(10000);

    log('Starting concurrent encryption operations with different data sizes');

    const [encryptedSmall, encryptedMedium, encryptedLarge] = await Promise.all([
      encryptPromise(new TextEncoder().encode(smallData), mockCacheConfig),
      encryptPromise(new TextEncoder().encode(mediumData), mockCacheConfig),
      encryptPromise(new TextEncoder().encode(largeData), mockCacheConfig),
    ]);

    log('All encryption operations completed');

    const [decryptedSmall, decryptedMedium, decryptedLarge] = await Promise.all([
      decryptPromise(encryptedSmall, mockCacheConfig),
      decryptPromise(encryptedMedium, mockCacheConfig),
      decryptPromise(encryptedLarge, mockCacheConfig),
    ]);

    log('All decryption operations completed');

    expect(decryptedSmall && new TextDecoder().decode(decryptedSmall)).toEqual(smallData);
    expect(decryptedMedium && new TextDecoder().decode(decryptedMedium)).toEqual(mediumData);
    expect(decryptedLarge && new TextDecoder().decode(decryptedLarge)).toEqual(largeData);

    log('All decrypted data matches original data of different sizes');
  });
});
