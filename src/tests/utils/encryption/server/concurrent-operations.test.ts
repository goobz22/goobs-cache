import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('concurrent-operations-encryption.log');
const log = createLogger(logStream);

describe('Concurrent Encryption and Decryption Operations', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const runConcurrentOperations = async (
    operationCount: number,
    operation: (index: number) => Promise<void>,
  ): Promise<void> => {
    const operations = Array.from({ length: operationCount }, (_, index) => operation(index));
    await Promise.all(operations);
  };

  it('should handle multiple concurrent encryption operations', async () => {
    const operationCount = 100;
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    await runConcurrentOperations(operationCount, async (index) => {
      const data = new TextEncoder().encode(`Concurrent encryption test ${index}`);
      const password = `password-${index}`;

      const encryptedValue = await encrypt(data, password, config);
      expect(encryptedValue).toBeDefined();
      expect(encryptedValue.type).toBe('encrypted');
    });
  });

  it('should handle multiple concurrent decryption operations', async () => {
    const operationCount = 100;
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValues = await Promise.all(
      Array.from({ length: operationCount }, async (_, index) => {
        const data = new TextEncoder().encode(`Concurrent decryption test ${index}`);
        const password = `password-${index}`;
        return encrypt(data, password, config);
      }),
    );

    await runConcurrentOperations(operationCount, async (index) => {
      const password = `password-${index}`;
      const decryptedData = await decrypt(encryptedValues[index], password, config);
      const decryptedString = new TextDecoder().decode(decryptedData);
      expect(decryptedString).toBe(`Concurrent decryption test ${index}`);
    });
  });

  it('should handle concurrent encryption and decryption operations', async () => {
    const operationCount = 50;
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptionPromises = Array.from({ length: operationCount }, async (_, index) => {
      const data = new TextEncoder().encode(`Mixed concurrent test ${index}`);
      const password = `password-${index}`;
      return encrypt(data, password, config);
    });

    const decryptionPromises = Array.from({ length: operationCount }, async (_, index) => {
      const encryptedValue = await encryptionPromises[index];
      const password = `password-${index}`;
      const decryptedData = await decrypt(encryptedValue, password, config);
      const decryptedString = new TextDecoder().decode(decryptedData);
      expect(decryptedString).toBe(`Mixed concurrent test ${index}`);
    });

    await Promise.all([...encryptionPromises, ...decryptionPromises]);
  });
});
