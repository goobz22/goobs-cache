import { jest } from '@jest/globals';
import { CacheResult, StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache remove tests', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('removeTests.log', 'cookie');
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

  it('should remove an existing item from the cache', async () => {
    log('Starting test: should remove an existing item from the cache');
    const testData: StringValue = { type: 'string', value: 'Test data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', testData, expirationDate);
    log('Test data set in cache');

    cookieCache.remove('testKey', 'testStore');
    log('Item removed from cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeUndefined();
        log('Verified that removed item is undefined');
        resolve();
      });
    });
  });

  it('should not throw an error when removing a non-existent item', () => {
    log('Starting test: should not throw an error when removing a non-existent item');
    expect(() => {
      cookieCache.remove('nonExistentKey', 'testStore');
      log('Attempted to remove non-existent item');
    }).not.toThrow();
    log('Verified that no error was thrown');
  });

  it('should remove the correct item when multiple items exist', async () => {
    log('Starting test: should remove the correct item when multiple items exist');
    const testData1: StringValue = { type: 'string', value: 'Test data 1' };
    const testData2: StringValue = { type: 'string', value: 'Test data 2' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey1', 'testStore', testData1, expirationDate);
    cookieCache.set('testKey2', 'testStore', testData2, expirationDate);
    log('Multiple test data set in cache');

    cookieCache.remove('testKey1', 'testStore');
    log('First item removed from cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey1', 'testStore', (result1: CacheResult | undefined) => {
        expect(result1).toBeUndefined();
        log('Verified that removed item is undefined');
        cookieCache.get('testKey2', 'testStore', (result2: CacheResult | undefined) => {
          expect(result2).toBeDefined();
          expect(result2?.value).toEqual(testData2);
          log('Verified that non-removed item still exists');
          resolve();
        });
      });
    });
  });

  it('should remove items from the correct store', async () => {
    log('Starting test: should remove items from the correct store');
    const testData: StringValue = { type: 'string', value: 'Test data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore1', testData, expirationDate);
    cookieCache.set('testKey', 'testStore2', testData, expirationDate);
    log('Test data set in multiple stores');

    cookieCache.remove('testKey', 'testStore1');
    log('Item removed from testStore1');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore1', (result1: CacheResult | undefined) => {
        expect(result1).toBeUndefined();
        log('Verified that item is removed from testStore1');
        cookieCache.get('testKey', 'testStore2', (result2: CacheResult | undefined) => {
          expect(result2).toBeDefined();
          expect(result2?.value).toEqual(testData);
          log('Verified that item still exists in testStore2');
          resolve();
        });
      });
    });
  });
});
