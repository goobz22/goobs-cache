import { jest } from '@jest/globals';
import { CacheResult, StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache encrypt and decrypt long string', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = runTestsWithLogging('encryptDecryptLongStringTests.log', 'cookie');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting tests');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cookieCache = mockCookieCacheInstance(defaultMockConfig);
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  afterEach(() => {
    log('Test cleanup complete');
  });

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  it('should successfully encrypt and decrypt a long string', async () => {
    log('Starting test: should successfully encrypt and decrypt a long string');
    const longString = 'a'.repeat(1000000); // 1 million characters
    const testData: StringValue = { type: 'string', value: longString };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Long string set in cache');

    await wait(100); // Wait for the set operation to complete

    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Long string retrieved and verified');
        resolve();
      });
    });
  });

  it('should handle multiple long string operations', async () => {
    log('Starting test: should handle multiple long string operations');
    const longString = 'b'.repeat(500000); // 500,000 characters
    const testData: StringValue = { type: 'string', value: longString };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    for (let i = 0; i < 5; i++) {
      await cookieCache.set(`testId${i}`, 'testStore', testData, expirationDate);
      log(`Long string ${i} set in cache`);
    }

    await wait(100); // Wait for all set operations to complete

    for (let i = 0; i < 5; i++) {
      await new Promise<void>((resolve) => {
        cookieCache.get(`testId${i}`, 'testStore', (result: CacheResult | undefined) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(testData);
          log(`Long string ${i} retrieved and verified`);
          resolve();
        });
      });
    }
  });

  it('should maintain integrity of long strings with special characters', async () => {
    log('Starting test: should maintain integrity of long strings with special characters');
    const specialChars = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`';
    const longString = (specialChars + 'abcdefghijklmnopqrstuvwxyz0123456789').repeat(10000);
    const testData: StringValue = { type: 'string', value: longString };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Long string with special characters set in cache');

    await wait(100); // Wait for the set operation to complete

    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Long string with special characters retrieved and verified');
        resolve();
      });
    });
  });
});
