import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('encryption-decryption-performance.log');
const log = createLogger(logStream);

describe('Encryption and Decryption Performance Measurement', () => {
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

  const decryptPromise = (
    encryptedValue: EncryptedValue,
    config: CacheConfig,
  ): Promise<Uint8Array | null> => {
    return new Promise((resolve) => {
      decrypt(encryptedValue, config, resolve);
    });
  };

  const measurePerformance = async (
    operation: () => Promise<unknown>,
    operationName: string,
  ): Promise<number> => {
    const start = performance.now();
    await operation();
    const end = performance.now();
    const duration = end - start;
    log(`${operationName} took ${duration.toFixed(2)} ms`);
    return duration;
  };

  const runEncryptionDecryptionTest = async (
    dataSize: number,
    iterations: number,
  ): Promise<{ avgEncryptionTime: number; avgDecryptionTime: number }> => {
    const data = new Uint8Array(dataSize);
    crypto.getRandomValues(data);

    const config: CacheConfig = {
      ...mockCacheConfig,
      algorithm: 'aes-256-gcm',
      keySize: 256,
    };

    let totalEncryptionTime = 0;
    let totalDecryptionTime = 0;

    for (let i = 0; i < iterations; i++) {
      const encryptionTime = await measurePerformance(
        () => encryptPromise(data, config),
        `Encryption (${dataSize} bytes, iteration ${i + 1})`,
      );
      totalEncryptionTime += encryptionTime;

      const encryptedValue = await encryptPromise(data, config);
      const decryptionTime = await measurePerformance(
        () => decryptPromise(encryptedValue, config),
        `Decryption (${dataSize} bytes, iteration ${i + 1})`,
      );
      totalDecryptionTime += decryptionTime;
    }

    const avgEncryptionTime = totalEncryptionTime / iterations;
    const avgDecryptionTime = totalDecryptionTime / iterations;

    log(`Average encryption time for ${dataSize} bytes: ${avgEncryptionTime.toFixed(2)} ms`);
    log(`Average decryption time for ${dataSize} bytes: ${avgDecryptionTime.toFixed(2)} ms`);

    return { avgEncryptionTime, avgDecryptionTime };
  };

  it('should measure performance for small data size (1KB)', async () => {
    const { avgEncryptionTime, avgDecryptionTime } = await runEncryptionDecryptionTest(1024, 100);
    expect(avgEncryptionTime).toBeGreaterThan(0);
    expect(avgDecryptionTime).toBeGreaterThan(0);
    expect(avgEncryptionTime).toBeLessThan(1000); // Assuming it should take less than 1 second
    expect(avgDecryptionTime).toBeLessThan(1000); // Assuming it should take less than 1 second
  });

  it('should measure performance for medium data size (1MB)', async () => {
    const { avgEncryptionTime, avgDecryptionTime } = await runEncryptionDecryptionTest(
      1024 * 1024,
      10,
    );
    expect(avgEncryptionTime).toBeGreaterThan(0);
    expect(avgDecryptionTime).toBeGreaterThan(0);
    expect(avgEncryptionTime).toBeLessThan(5000); // Assuming it should take less than 5 seconds
    expect(avgDecryptionTime).toBeLessThan(5000); // Assuming it should take less than 5 seconds
  });

  it('should measure performance for large data size (10MB)', async () => {
    const { avgEncryptionTime, avgDecryptionTime } = await runEncryptionDecryptionTest(
      10 * 1024 * 1024,
      5,
    );
    expect(avgEncryptionTime).toBeGreaterThan(0);
    expect(avgDecryptionTime).toBeGreaterThan(0);
    expect(avgEncryptionTime).toBeLessThan(30000); // Assuming it should take less than 30 seconds
    expect(avgDecryptionTime).toBeLessThan(30000); // Assuming it should take less than 30 seconds
  });

  it('should compare encryption and decryption times', async () => {
    const dataSize = 1024 * 1024; // 1MB
    const data = new Uint8Array(dataSize);
    crypto.getRandomValues(data);

    const config: CacheConfig = {
      ...mockCacheConfig,
      algorithm: 'aes-256-gcm',
      keySize: 256,
    };

    const encryptionTime = await measurePerformance(
      () => encryptPromise(data, config),
      'Encryption (1MB)',
    );

    const encryptedValue = await encryptPromise(data, config);
    const decryptionTime = await measurePerformance(
      () => decryptPromise(encryptedValue, config),
      'Decryption (1MB)',
    );

    const ratio = encryptionTime / decryptionTime;
    log(`Encryption/Decryption time ratio: ${ratio.toFixed(2)}`);

    expect(encryptionTime).toBeGreaterThan(0);
    expect(decryptionTime).toBeGreaterThan(0);
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(10); // Assuming encryption shouldn't be more than 10 times slower than decryption
  });
});
