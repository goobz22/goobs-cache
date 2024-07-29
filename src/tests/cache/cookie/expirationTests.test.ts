import { jest } from '@jest/globals';
import { CacheResult, StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache expiration tests', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = runTestsWithLogging('expirationTests.log', 'cookie');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting tests');
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cookieCache = mockCookieCacheInstance(defaultMockConfig);
    log('Test setup complete');
  });

  afterEach(() => {
    jest.clearAllTimers();
    log('Test cleanup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should return undefined for expired items', async () => {
    log('Starting test: should return undefined for expired items');
    const testData: StringValue = { type: 'string', value: 'Test data' };
    const expirationDate = new Date(Date.now() + 1000); // 1 second from now

    cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Test data set with 1 second expiration');

    jest.advanceTimersByTime(1001); // Advance time by 1 second and 1 millisecond
    log('Time advanced by 1001 milliseconds');

    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeUndefined();
        log('Verified that expired item returns undefined');
        resolve();
      });
    });
  });

  it('should return valid items before expiration', async () => {
    log('Starting test: should return valid items before expiration');
    const testData: StringValue = { type: 'string', value: 'Test data' };
    const expirationDate = new Date(Date.now() + 5000); // 5 seconds from now

    cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Test data set with 5 seconds expiration');

    jest.advanceTimersByTime(4999); // Advance time by 4 seconds and 999 milliseconds
    log('Time advanced by 4999 milliseconds');

    await new Promise<void>((resolve) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Verified that non-expired item returns correct data');
        resolve();
      });
    });
  });

  it('should handle multiple items with different expiration times', async () => {
    log('Starting test: should handle multiple items with different expiration times');
    const testData1: StringValue = { type: 'string', value: 'Test data 1' };
    const testData2: StringValue = { type: 'string', value: 'Test data 2' };
    const expirationDate1 = new Date(Date.now() + 3000); // 3 seconds from now
    const expirationDate2 = new Date(Date.now() + 6000); // 6 seconds from now

    cookieCache.set('testId1', 'testStore', testData1, expirationDate1);
    cookieCache.set('testId2', 'testStore', testData2, expirationDate2);
    log('Two test items set with different expiration times');

    jest.advanceTimersByTime(4000); // Advance time by 4 seconds
    log('Time advanced by 4000 milliseconds');

    await new Promise<void>((resolve) => {
      cookieCache.get('testId1', 'testStore', (result1: CacheResult | undefined) => {
        expect(result1).toBeUndefined();
        log('Verified that first item (expired) returns undefined');
        cookieCache.get('testId2', 'testStore', (result2: CacheResult | undefined) => {
          expect(result2).toBeDefined();
          expect(result2?.value).toEqual(testData2);
          log('Verified that second item (not expired) returns correct data');
          resolve();
        });
      });
    });
  });
});
