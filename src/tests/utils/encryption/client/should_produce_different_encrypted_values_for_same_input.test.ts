import { encrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('different-encrypted-values-same-input.log');
const log = createLogger(logStream);

describe('Produce Different Encrypted Values for Same Input', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const encryptPromise = (data: Uint8Array, config: CacheConfig): Promise<EncryptedValue> => {
    return new Promise((resolve) => {
      encrypt(data, config, resolve);
    });
  };

  it('should produce different encrypted values for the same input', async () => {
    const input = new TextEncoder().encode('Test data');
    const iterations = 10;
    const encryptedValues: EncryptedValue[] = [];

    for (let i = 0; i < iterations; i++) {
      const encryptedValue = await encryptPromise(input, mockCacheConfig);
      encryptedValues.push(encryptedValue);
    }

    // Check that all encrypted values are different
    for (let i = 0; i < iterations; i++) {
      for (let j = i + 1; j < iterations; j++) {
        expect(encryptedValues[i]).not.toEqual(encryptedValues[j]);
      }
    }

    // Check that specific components are different
    for (let i = 0; i < iterations; i++) {
      for (let j = i + 1; j < iterations; j++) {
        expect(encryptedValues[i].iv).not.toEqual(encryptedValues[j].iv);
        expect(encryptedValues[i].salt).not.toEqual(encryptedValues[j].salt);
        expect(encryptedValues[i].encryptedData).not.toEqual(encryptedValues[j].encryptedData);
      }
    }
  });

  it('should produce different encrypted values for empty input', async () => {
    const emptyInput = new Uint8Array(0);
    const iterations = 5;
    const encryptedValues: EncryptedValue[] = [];

    for (let i = 0; i < iterations; i++) {
      const encryptedValue = await encryptPromise(emptyInput, mockCacheConfig);
      encryptedValues.push(encryptedValue);
    }

    for (let i = 0; i < iterations; i++) {
      for (let j = i + 1; j < iterations; j++) {
        expect(encryptedValues[i]).not.toEqual(encryptedValues[j]);
      }
    }
  });

  it('should produce different encrypted values for large input', async () => {
    const largeInput = new Uint8Array(1024 * 1024); // 1MB
    crypto.getRandomValues(largeInput);
    const iterations = 3;
    const encryptedValues: EncryptedValue[] = [];

    for (let i = 0; i < iterations; i++) {
      const encryptedValue = await encryptPromise(largeInput, mockCacheConfig);
      encryptedValues.push(encryptedValue);
    }

    for (let i = 0; i < iterations; i++) {
      for (let j = i + 1; j < iterations; j++) {
        expect(encryptedValues[i]).not.toEqual(encryptedValues[j]);
      }
    }
  });

  it('should produce different encrypted values with different configurations', async () => {
    const input = new TextEncoder().encode('Test data');
    const config1: CacheConfig = { ...mockCacheConfig, encryptionPassword: 'password1' };
    const config2: CacheConfig = { ...mockCacheConfig, encryptionPassword: 'password2' };

    const encryptedValue1 = await encryptPromise(input, config1);
    const encryptedValue2 = await encryptPromise(input, config2);

    expect(encryptedValue1).not.toEqual(encryptedValue2);
    expect(encryptedValue1.iv).not.toEqual(encryptedValue2.iv);
    expect(encryptedValue1.salt).not.toEqual(encryptedValue2.salt);
    expect(encryptedValue1.encryptedData).not.toEqual(encryptedValue2.encryptedData);
  });
});
