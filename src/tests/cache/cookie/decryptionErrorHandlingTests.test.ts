import { CacheResult, DataValue, EncryptedValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { mockEncrypt, mockDecrypt } from '../../../jest/mocks/utils/client/encryption.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache decryption error handling', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};
  let restoreError: () => void;

  beforeAll(async () => {
    const logFunction = runTestsWithLogging('decryptionErrorHandlingTests.log', 'cookie');
    log = await logFunction(0, 0, 0);
    restoreError = setupErrorHandling(log);
    log('Starting tests');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cookieCache = mockCookieCacheInstance(defaultMockConfig);
    log('Test setup complete');
  });

  afterAll(() => {
    restoreError();
    closeLogStreams();
  });

  afterEach(() => {
    log('Test cleanup complete');
  });

  const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  it('should handle decryption errors gracefully', async () => {
    log('Starting test: should handle decryption errors gracefully');
    const testData: DataValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    // Mock encryption to succeed
    mockEncrypt.mockImplementationOnce((value: Uint8Array, config, callback) => {
      const mockEncryptedValue: EncryptedValue = {
        type: 'encrypted',
        encryptedData: new Uint8Array([1, 2, 3]),
        iv: new Uint8Array([4, 5, 6]),
        salt: new Uint8Array([7, 8, 9]),
        authTag: new Uint8Array([10, 11, 12]),
        encryptionKey: new Uint8Array([13, 14, 15]),
      };
      callback(mockEncryptedValue);
    });
    log('Encryption mocked to succeed');

    // Set the value
    await cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Test value set in cache');

    await wait(100); // Wait for the set operation to complete

    // Mock decryption to fail
    mockDecrypt.mockImplementationOnce((value: EncryptedValue, config, callback) => {
      callback(null);
    });
    log('Decryption mocked to fail');

    // Try to get the value
    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeUndefined();
        log('Verified that result is undefined after decryption failure');
        resolve();
      });
    });
  });

  it('should handle JSON parsing errors after decryption', async () => {
    log('Starting test: should handle JSON parsing errors after decryption');
    const testData: DataValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    // Mock encryption to succeed
    mockEncrypt.mockImplementationOnce((value: Uint8Array, config, callback) => {
      const mockEncryptedValue: EncryptedValue = {
        type: 'encrypted',
        encryptedData: new Uint8Array([1, 2, 3]),
        iv: new Uint8Array([4, 5, 6]),
        salt: new Uint8Array([7, 8, 9]),
        authTag: new Uint8Array([10, 11, 12]),
        encryptionKey: new Uint8Array([13, 14, 15]),
      };
      callback(mockEncryptedValue);
    });
    log('Encryption mocked to succeed');

    // Set the value
    await cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Test value set in cache');

    await wait(100); // Wait for the set operation to complete

    // Mock decryption to return invalid JSON
    mockDecrypt.mockImplementationOnce((value: EncryptedValue, config, callback) => {
      callback(new Uint8Array([123, 34, 105, 110, 118, 97, 108, 105, 100, 34, 58])); // "{\"invalid\":"
    });
    log('Decryption mocked to return invalid JSON');

    // Try to get the value
    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeUndefined();
        log('Verified that result is undefined after JSON parsing failure');
        resolve();
      });
    });
  });
});
