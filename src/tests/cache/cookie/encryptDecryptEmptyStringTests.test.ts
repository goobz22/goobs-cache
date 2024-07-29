import { jest } from '@jest/globals';
import { CacheResult, StringValue, PrimitiveValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache encrypt and decrypt empty string', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};
  let restoreError: () => void;

  beforeAll(async () => {
    const logFunction = runTestsWithLogging('encryptDecryptEmptyStringTests.log', 'cookie');
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

  it('should successfully encrypt and decrypt an empty string', async () => {
    log('Starting test: should successfully encrypt and decrypt an empty string');
    const testData: StringValue = { type: 'string', value: '' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Empty string set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Empty string retrieved and verified');
        resolve();
      });
    });
  });

  it('should handle multiple empty string operations', async () => {
    log('Starting test: should handle multiple empty string operations');
    const testData: StringValue = { type: 'string', value: '' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    for (let i = 0; i < 5; i++) {
      cookieCache.set(`testId${i}`, 'testStore', testData, expirationDate);
      log(`Empty string ${i} set in cache`);
    }

    for (let i = 0; i < 5; i++) {
      await new Promise<void>((resolve) => {
        cookieCache.get(`testId${i}`, 'testStore', (result: CacheResult | undefined) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(testData);
          log(`Empty string ${i} retrieved and verified`);
          resolve();
        });
      });
    }
  });

  it('should differentiate between empty string and other primitive values', async () => {
    log('Starting test: should differentiate between empty string and other primitive values');
    const emptyStringData: StringValue = { type: 'string', value: '' };
    const nullData: PrimitiveValue = null;
    const undefinedData: PrimitiveValue = undefined;
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('emptyStringId', 'testStore', emptyStringData, expirationDate);
    log('Empty string set in cache');

    cookieCache.set('nullId', 'testStore', nullData, expirationDate);
    log('Null value set in cache');

    cookieCache.set('undefinedId', 'testStore', undefinedData, expirationDate);
    log('Undefined value set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('emptyStringId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(emptyStringData);
        log('Empty string retrieved and verified');
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      cookieCache.get('nullId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(nullData);
        log('Null value retrieved and verified');
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      cookieCache.get('undefinedId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(undefinedData);
        log('Undefined value retrieved and verified');
        resolve();
      });
    });
  });
});
