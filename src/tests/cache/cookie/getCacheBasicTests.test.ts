import { jest } from '@jest/globals';
import { CacheResult, StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache basic get tests', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = runTestsWithLogging('basicGetTests.log', 'cookie');
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

  it('should return undefined for non-existent keys', async () => {
    log('Starting test: should return undefined for non-existent keys');
    await new Promise<void>((resolve) => {
      cookieCache.get('nonExistentKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeUndefined();
        log('Verified that non-existent key returns undefined');
        resolve();
      });
    });
  });

  it('should return the correct value for an existing key', async () => {
    log('Starting test: should return the correct value for an existing key');
    const testData: StringValue = { type: 'string', value: 'Test data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', testData, expirationDate);
    log('Test data set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Verified that correct value is returned for existing key');
        resolve();
      });
    });
  });

  it('should handle multiple get operations', async () => {
    log('Starting test: should handle multiple get operations');
    const testData1: StringValue = { type: 'string', value: 'Test data 1' };
    const testData2: StringValue = { type: 'string', value: 'Test data 2' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey1', 'testStore', testData1, expirationDate);
    cookieCache.set('testKey2', 'testStore', testData2, expirationDate);
    log('Multiple test data set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey1', 'testStore', (result1: CacheResult | undefined) => {
        expect(result1).toBeDefined();
        expect(result1?.value).toEqual(testData1);
        log('Verified correct value for first key');
        cookieCache.get('testKey2', 'testStore', (result2: CacheResult | undefined) => {
          expect(result2).toBeDefined();
          expect(result2?.value).toEqual(testData2);
          log('Verified correct value for second key');
          resolve();
        });
      });
    });
  });

  it('should return undefined for a removed key', async () => {
    log('Starting test: should return undefined for a removed key');
    const testData: StringValue = { type: 'string', value: 'Test data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', testData, expirationDate);
    log('Test data set in cache');

    cookieCache.remove('testKey', 'testStore');
    log('Test key removed from cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeUndefined();
        log('Verified that removed key returns undefined');
        resolve();
      });
    });
  });
});
