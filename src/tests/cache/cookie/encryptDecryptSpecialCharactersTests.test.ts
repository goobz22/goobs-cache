import { jest } from '@jest/globals';
import { CacheResult, StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache encrypt and decrypt special characters', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = runTestsWithLogging('encryptDecryptSpecialCharactersTests.log', 'cookie');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting tests');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cookieCache = mockCookieCacheInstance(defaultMockConfig);
    log('Test setup complete');
  });

  afterEach(() => {
    log('Test cleanup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should successfully encrypt and decrypt string with special characters', async () => {
    log('Starting test: should successfully encrypt and decrypt string with special characters');
    const specialChars = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`';
    const testData: StringValue = { type: 'string', value: specialChars };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Special characters string set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Special characters string retrieved and verified');
        resolve();
      });
    });
  });

  it('should handle Unicode characters', async () => {
    log('Starting test: should handle Unicode characters');
    const unicodeChars = '你好世界😊🌍🚀';
    const testData: StringValue = { type: 'string', value: unicodeChars };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Unicode characters string set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Unicode characters string retrieved and verified');
        resolve();
      });
    });
  });

  it('should handle mixed alphanumeric and special characters', async () => {
    log('Starting test: should handle mixed alphanumeric and special characters');
    const mixedChars = 'a1B2c3!@#$你好😊';
    const testData: StringValue = { type: 'string', value: mixedChars };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Mixed characters string set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Mixed characters string retrieved and verified');
        resolve();
      });
    });
  });
});
