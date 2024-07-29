import { jest } from '@jest/globals';
import { CacheResult, JSONValue, JSONObject } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache encrypt and decrypt object', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = runTestsWithLogging('encryptDecryptObjectTests.log', 'cookie');
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

  it('should successfully encrypt and decrypt a simple object', async () => {
    log('Starting test: should successfully encrypt and decrypt a simple object');
    const testObject: JSONObject = { name: 'John Doe', age: 30, isActive: true };
    const testData: JSONValue = { type: 'json', value: testObject };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Simple object set in cache');

    await wait(100); // Wait for the set operation to complete

    await new Promise<void>((resolve, reject) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        try {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(testData);
          log('Simple object retrieved and verified');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it('should handle nested objects', async () => {
    log('Starting test: should handle nested objects');
    const testObject: JSONObject = {
      user: {
        name: 'Jane Smith',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          country: 'USA',
        },
      },
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    };
    const testData: JSONValue = { type: 'json', value: testObject };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Nested object set in cache');

    await wait(100); // Wait for the set operation to complete

    await new Promise<void>((resolve, reject) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        try {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(testData);
          log('Nested object retrieved and verified');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it('should handle objects with array properties', async () => {
    log('Starting test: should handle objects with array properties');
    const testObject: JSONObject = {
      items: ['apple', 'banana', 'orange'],
      scores: [85, 92, 78],
      mixed: [1, 'two', { three: 3 }, [4, 5]],
    };
    const testData: JSONValue = { type: 'json', value: testObject };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await cookieCache.set('testId', 'testStore', testData, expirationDate);
    log('Object with array properties set in cache');

    await wait(100); // Wait for the set operation to complete

    await new Promise<void>((resolve, reject) => {
      cookieCache.get('testId', 'testStore', (result: CacheResult | undefined) => {
        try {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(testData);
          log('Object with array properties retrieved and verified');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });
});
