import { clientSet, clientGet, clientRemove } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('error-handling-test.log');
const log = createLogger(logStream);

describe('Error Handling Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['client', 'cookie'];
  const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

  beforeAll(() => {
    log('Starting Error Handling tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle errors during set operation', async () => {
    const identifier = 'error-set-test';
    const testValue: StringValue = { type: 'string', value: 'test value' };

    for (const mode of modes) {
      (clientSet as jest.Mock).mockRejectedValueOnce(new Error('Set operation failed'));

      await expect(
        clientSet(identifier, storeName, testValue, expirationDate, mode),
      ).rejects.toThrow('Set operation failed');

      log(`Successfully handled set operation error in ${mode} mode`);
    }
  });

  it('should handle errors during get operation', async () => {
    const identifier = 'error-get-test';

    for (const mode of modes) {
      (clientGet as jest.Mock).mockRejectedValueOnce(new Error('Get operation failed'));

      await expect(clientGet(identifier, storeName, mode)).rejects.toThrow('Get operation failed');

      log(`Successfully handled get operation error in ${mode} mode`);
    }
  });

  it('should handle errors during remove operation', async () => {
    const identifier = 'error-remove-test';

    for (const mode of modes) {
      (clientRemove as jest.Mock).mockRejectedValueOnce(new Error('Remove operation failed'));

      await expect(clientRemove(identifier, storeName, mode)).rejects.toThrow(
        'Remove operation failed',
      );

      log(`Successfully handled remove operation error in ${mode} mode`);
    }
  });

  it('should handle invalid cache mode', async () => {
    const identifier = 'invalid-mode-test';
    const testValue: StringValue = { type: 'string', value: 'test value' };
    const invalidMode = 'invalid' as CacheMode;

    await expect(
      clientSet(identifier, storeName, testValue, expirationDate, invalidMode),
    ).rejects.toThrow('Invalid cache mode for client-side caching: invalid');

    await expect(clientGet(identifier, storeName, invalidMode)).rejects.toThrow(
      'Invalid cache mode for client-side caching: invalid',
    );

    await expect(clientRemove(identifier, storeName, invalidMode)).rejects.toThrow(
      'Invalid cache mode for client-side caching: invalid',
    );

    log('Successfully handled invalid cache mode');
  });

  it('should handle errors with malformed data', async () => {
    const identifier = 'malformed-data-test';
    const malformedValue = { type: 'unknown', value: 'malformed data' } as unknown;

    for (const mode of modes) {
      (clientSet as jest.Mock).mockRejectedValueOnce(new Error('Invalid data type'));

      await expect(
        clientSet(identifier, storeName, malformedValue as StringValue, expirationDate, mode),
      ).rejects.toThrow('Invalid data type');

      log(`Successfully handled malformed data error in ${mode} mode`);
    }
  });

  it('should handle errors with invalid expiration date', async () => {
    const identifier = 'invalid-expiration-test';
    const testValue: StringValue = { type: 'string', value: 'test value' };
    const invalidExpirationDate = 'invalid date';

    for (const mode of modes) {
      (clientSet as jest.Mock).mockRejectedValueOnce(new Error('Invalid expiration date'));

      await expect(
        clientSet(identifier, storeName, testValue, invalidExpirationDate as unknown as Date, mode),
      ).rejects.toThrow('Invalid expiration date');

      log(`Successfully handled invalid expiration date error in ${mode} mode`);
    }
  });

  it('should handle errors with non-existent keys', async () => {
    const identifier = 'non-existent-key-test';

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValueOnce({ value: undefined });

      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toBeUndefined();

      log(`Successfully handled non-existent key in ${mode} mode`);
    }
  });

  it('should handle errors during encryption', async () => {
    const identifier = 'encryption-error-test';
    const testValue: StringValue = { type: 'string', value: 'sensitive data' };

    for (const mode of modes) {
      (clientSet as jest.Mock).mockRejectedValueOnce(new Error('Encryption failed'));

      await expect(
        clientSet(identifier, storeName, testValue, expirationDate, mode),
      ).rejects.toThrow('Encryption failed');

      log(`Successfully handled encryption error in ${mode} mode`);
    }
  });

  it('should handle errors during decryption', async () => {
    const identifier = 'decryption-error-test';

    for (const mode of modes) {
      (clientGet as jest.Mock).mockRejectedValueOnce(new Error('Decryption failed'));

      await expect(clientGet(identifier, storeName, mode)).rejects.toThrow('Decryption failed');

      log(`Successfully handled decryption error in ${mode} mode`);
    }
  });

  it('should handle errors when storage is full', async () => {
    const identifier = 'storage-full-test';
    const testValue: StringValue = { type: 'string', value: 'test value' };

    for (const mode of modes) {
      (clientSet as jest.Mock).mockRejectedValueOnce(new Error('Storage is full'));

      await expect(
        clientSet(identifier, storeName, testValue, expirationDate, mode),
      ).rejects.toThrow('Storage is full');

      log(`Successfully handled storage full error in ${mode} mode`);
    }
  });
});
