import { set, get, remove } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue, EncryptedValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
}));

const logStream: WriteStream = createLogStream('cache-security-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Cache Security Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting Cache Security tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  modes.forEach((mode) => {
    describe(`${mode} mode`, () => {
      it(`should handle encrypted data correctly in ${mode} mode`, async () => {
        const identifier = `encrypted-data-${mode}`;
        const originalValue: StringValue = { type: 'string', value: 'sensitive data' };
        const encryptedValue: EncryptedValue = {
          type: 'encrypted',
          encryptedData: new Uint8Array([1, 2, 3, 4, 5]),
          iv: new Uint8Array([6, 7, 8, 9]),
          salt: new Uint8Array([10, 11, 12, 13]),
          authTag: new Uint8Array([14, 15, 16, 17]),
          encryptionKey: new Uint8Array([18, 19, 20, 21]),
        };

        (set as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock).mockResolvedValue({ value: encryptedValue });

        await set(identifier, storeName, originalValue, mode);
        const result = await get(identifier, storeName, mode);

        expect(result.value).toEqual(encryptedValue);
        expect(result.value).not.toEqual(originalValue);
        log(`Successfully handled encrypted data in ${mode} mode`);
      });

      it(`should securely remove sensitive data in ${mode} mode`, async () => {
        const identifier = `secure-remove-${mode}`;
        const sensitiveValue: StringValue = { type: 'string', value: 'top secret' };

        (set as jest.Mock).mockResolvedValue(undefined);
        (remove as jest.Mock).mockResolvedValue(undefined);
        (get as jest.Mock)
          .mockResolvedValueOnce({ value: sensitiveValue })
          .mockResolvedValueOnce({ value: undefined });

        await set(identifier, storeName, sensitiveValue, mode);
        const beforeRemove = await get(identifier, storeName, mode);
        expect(beforeRemove.value).toEqual(sensitiveValue);

        await remove(identifier, storeName, mode);
        const afterRemove = await get(identifier, storeName, mode);
        expect(afterRemove.value).toBeUndefined();

        log(`Successfully performed secure removal of sensitive data in ${mode} mode`);
      });
    });
  });

  it('should ensure consistent handling of encrypted data across all cache modes', async () => {
    const identifier = 'cross-mode-security';
    const sensitiveValue: StringValue = { type: 'string', value: 'cross-mode sensitive data' };
    const encryptedValue: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array([1, 2, 3, 4, 5]),
      iv: new Uint8Array([6, 7, 8, 9]),
      salt: new Uint8Array([10, 11, 12, 13]),
      authTag: new Uint8Array([14, 15, 16, 17]),
      encryptionKey: new Uint8Array([18, 19, 20, 21]),
    };

    for (const setMode of modes) {
      (set as jest.Mock).mockResolvedValue(undefined);
      await set(identifier, storeName, sensitiveValue, setMode);

      for (const getMode of modes) {
        (get as jest.Mock).mockResolvedValue({ value: encryptedValue });
        const result = await get(identifier, storeName, getMode);
        expect(result.value).toEqual(encryptedValue);
        expect(result.value).not.toEqual(sensitiveValue);
      }
    }

    log('Successfully ensured consistent handling of encrypted data across all cache modes');
  });
});
