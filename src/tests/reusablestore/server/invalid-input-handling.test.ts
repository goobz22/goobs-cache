import { serverSet, serverGet, serverRemove } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('invalid-input-handling-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Invalid Input Handling Tests', () => {
  const validStoreName = 'test-store';
  const validMode: CacheMode = 'server';
  const validIdentifier = 'test-identifier';
  const validValue: StringValue = { type: 'string', value: 'test value' };
  const validExpirationDate = new Date(Date.now() + 3600000);

  beforeAll(() => {
    log('Starting Invalid Input Handling tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  describe('serverSet', () => {
    it('should throw an error when identifier is empty', async () => {
      await expect(
        serverSet('', validStoreName, validValue, validExpirationDate, validMode),
      ).rejects.toThrow('Invalid identifier');
      log('Successfully handled empty identifier in serverSet');
    });

    it('should throw an error when storeName is empty', async () => {
      await expect(
        serverSet(validIdentifier, '', validValue, validExpirationDate, validMode),
      ).rejects.toThrow('Invalid store name');
      log('Successfully handled empty storeName in serverSet');
    });

    it('should throw an error when value is null', async () => {
      await expect(
        serverSet(
          validIdentifier,
          validStoreName,
          null as unknown as StringValue,
          validExpirationDate,
          validMode,
        ),
      ).rejects.toThrow('Invalid value');
      log('Successfully handled null value in serverSet');
    });

    it('should throw an error when expirationDate is invalid', async () => {
      await expect(
        serverSet(validIdentifier, validStoreName, validValue, new Date('invalid date'), validMode),
      ).rejects.toThrow('Invalid expiration date');
      log('Successfully handled invalid expirationDate in serverSet');
    });

    it('should throw an error when mode is invalid', async () => {
      await expect(
        serverSet(
          validIdentifier,
          validStoreName,
          validValue,
          validExpirationDate,
          'invalid' as CacheMode,
        ),
      ).rejects.toThrow('Invalid cache mode for server-side caching: invalid');
      log('Successfully handled invalid mode in serverSet');
    });
  });

  describe('serverGet', () => {
    it('should throw an error when identifier is empty', async () => {
      await expect(serverGet('', validStoreName, validMode)).rejects.toThrow('Invalid identifier');
      log('Successfully handled empty identifier in serverGet');
    });

    it('should throw an error when storeName is empty', async () => {
      await expect(serverGet(validIdentifier, '', validMode)).rejects.toThrow('Invalid store name');
      log('Successfully handled empty storeName in serverGet');
    });

    it('should throw an error when mode is invalid', async () => {
      await expect(
        serverGet(validIdentifier, validStoreName, 'invalid' as CacheMode),
      ).rejects.toThrow('Invalid cache mode for server-side caching: invalid');
      log('Successfully handled invalid mode in serverGet');
    });
  });

  describe('serverRemove', () => {
    it('should throw an error when identifier is empty', async () => {
      await expect(serverRemove('', validStoreName, validMode)).rejects.toThrow(
        'Invalid identifier',
      );
      log('Successfully handled empty identifier in serverRemove');
    });

    it('should throw an error when storeName is empty', async () => {
      await expect(serverRemove(validIdentifier, '', validMode)).rejects.toThrow(
        'Invalid store name',
      );
      log('Successfully handled empty storeName in serverRemove');
    });

    it('should throw an error when mode is invalid', async () => {
      await expect(
        serverRemove(validIdentifier, validStoreName, 'invalid' as CacheMode),
      ).rejects.toThrow('Invalid cache mode for server-side caching: invalid');
      log('Successfully handled invalid mode in serverRemove');
    });
  });

  it('should handle undefined inputs consistently across all functions', async () => {
    const undefinedChecks = [
      serverSet(
        undefined as unknown as string,
        validStoreName,
        validValue,
        validExpirationDate,
        validMode,
      ),
      serverGet(undefined as unknown as string, validStoreName, validMode),
      serverRemove(undefined as unknown as string, validStoreName, validMode),
    ];

    for (const check of undefinedChecks) {
      await expect(check).rejects.toThrow('Invalid identifier');
    }
    log('Successfully handled undefined inputs consistently across all functions');
  });

  it('should handle non-string inputs for identifier and storeName', async () => {
    const nonStringChecks = [
      serverSet(
        123 as unknown as string,
        validStoreName,
        validValue,
        validExpirationDate,
        validMode,
      ),
      serverGet(123 as unknown as string, validStoreName, validMode),
      serverRemove(123 as unknown as string, validStoreName, validMode),
      serverSet(
        validIdentifier,
        123 as unknown as string,
        validValue,
        validExpirationDate,
        validMode,
      ),
      serverGet(validIdentifier, 123 as unknown as string, validMode),
      serverRemove(validIdentifier, 123 as unknown as string, validMode),
    ];

    for (const check of nonStringChecks) {
      await expect(check).rejects.toThrow(/Invalid identifier|Invalid store name/);
    }
    log('Successfully handled non-string inputs for identifier and storeName');
  });

  it('should handle extremely long identifiers and storeNames', async () => {
    const longString = 'a'.repeat(10000);
    const longChecks = [
      serverSet(longString, validStoreName, validValue, validExpirationDate, validMode),
      serverGet(longString, validStoreName, validMode),
      serverRemove(longString, validStoreName, validMode),
      serverSet(validIdentifier, longString, validValue, validExpirationDate, validMode),
      serverGet(validIdentifier, longString, validMode),
      serverRemove(validIdentifier, longString, validMode),
    ];

    for (const check of longChecks) {
      await expect(check).rejects.toThrow(/Invalid identifier|Invalid store name/);
    }
    log('Successfully handled extremely long identifiers and storeNames');
  });
});
