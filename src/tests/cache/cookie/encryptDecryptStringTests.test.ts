import { jest } from '@jest/globals';
import { CacheResult, StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache encrypt and decrypt string', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = runTestsWithLogging('encryptDecryptStringTests.log', 'cookie');
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

  it('should successfully encrypt and decrypt a simple string', async () => {
    log('Starting test: should successfully encrypt and decrypt a simple string');
    const testData: StringValue = { type: 'string', value: 'Hello, World!' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Simple string set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Simple string retrieved and verified');
        resolve();
      });
    });
  });

  it('should handle strings with spaces and punctuation', async () => {
    log('Starting test: should handle strings with spaces and punctuation');
    const testData: StringValue = {
      type: 'string',
      value: 'This is a test. It has spaces and punctuation!',
    };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('String with spaces and punctuation set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('String with spaces and punctuation retrieved and verified');
        resolve();
      });
    });
  });

  it('should handle multiple string operations', async () => {
    log('Starting test: should handle multiple string operations');
    const testStrings = [
      'First string',
      'Second string with more words',
      'Third string 123',
      'Fourth string with symbols !@#',
    ];

    for (let i = 0; i < testStrings.length; i++) {
      const testData: StringValue = { type: 'string', value: testStrings[i] };
      const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      cookieCache.set(`testId${i}`, 'testStore', testData, expirationDate);
      log(`String ${i + 1} set in cache`);
    }

    for (let i = 0; i < testStrings.length; i++) {
      await new Promise<void>((resolve) => {
        cookieCache.get(`testId${i}`, 'testStore', (result: CacheResult | undefined) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual({ type: 'string', value: testStrings[i] });
          log(`String ${i + 1} retrieved and verified`);
          resolve();
        });
      });
    }
  });
});
