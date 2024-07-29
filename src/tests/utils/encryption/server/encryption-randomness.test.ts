import { encrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig, EncryptedValue } from '../../../../types';

const logStream: WriteStream = createLogStream('encryption-randomness.log');
const log = createLogger(logStream);

describe('Encryption Randomness', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const encryptMultipleTimes = async (
    data: Uint8Array,
    password: string,
    config: CacheConfig,
    times: number,
  ): Promise<EncryptedValue[]> => {
    const results: EncryptedValue[] = [];
    for (let i = 0; i < times; i++) {
      results.push(await encrypt(data, password, config));
    }
    return results;
  };

  it('should produce different encrypted values for the same input', async () => {
    const data = new TextEncoder().encode('Test data for randomness');
    const password = 'randomness-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptionCount = 10;

    const encryptedValues = await encryptMultipleTimes(data, password, config, encryptionCount);

    for (let i = 0; i < encryptionCount; i++) {
      for (let j = i + 1; j < encryptionCount; j++) {
        expect(encryptedValues[i].encryptedData).not.toEqual(encryptedValues[j].encryptedData);
        expect(encryptedValues[i].iv).not.toEqual(encryptedValues[j].iv);
        expect(encryptedValues[i].salt).not.toEqual(encryptedValues[j].salt);
      }
    }
  });

  it('should use different IVs for each encryption', async () => {
    const data = new TextEncoder().encode('Test data for IV randomness');
    const password = 'iv-randomness-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptionCount = 100;

    const encryptedValues = await encryptMultipleTimes(data, password, config, encryptionCount);
    const ivs = encryptedValues.map((value) => value.iv);

    const uniqueIVs = new Set(ivs.map((iv) => iv.toString()));
    expect(uniqueIVs.size).toBe(encryptionCount);
  });

  it('should use different salts for each encryption', async () => {
    const data = new TextEncoder().encode('Test data for salt randomness');
    const password = 'salt-randomness-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptionCount = 100;

    const encryptedValues = await encryptMultipleTimes(data, password, config, encryptionCount);
    const salts = encryptedValues.map((value) => value.salt);

    const uniqueSalts = new Set(salts.map((salt) => salt.toString()));
    expect(uniqueSalts.size).toBe(encryptionCount);
  });

  it('should produce different encrypted data for each encryption', async () => {
    const data = new TextEncoder().encode('Test data for encrypted data randomness');
    const password = 'encrypted-data-randomness-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptionCount = 100;

    const encryptedValues = await encryptMultipleTimes(data, password, config, encryptionCount);
    const encryptedDataArray = encryptedValues.map((value) => value.encryptedData);

    const uniqueEncryptedData = new Set(encryptedDataArray.map((data) => data.toString()));
    expect(uniqueEncryptedData.size).toBe(encryptionCount);
  });
});
