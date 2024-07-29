import { jest } from '@jest/globals';
import { CacheResult, StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache multiple set and get operations', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('multipleSetGetOperationsTests.log', 'cookie');
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

  it('should handle multiple set and get operations correctly', async () => {
    log('Starting test: should handle multiple set and get operations correctly');
    const testData: StringValue[] = [
      { type: 'string', value: 'Test data 1' },
      { type: 'string', value: 'Test data 2' },
      { type: 'string', value: 'Test data 3' },
    ];
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    // Perform multiple set operations
    for (let i = 0; i < testData.length; i++) {
      cookieCache.set(`testKey${i}`, 'testStore', testData[i], expirationDate);
      log(`Set operation ${i + 1} completed`);
    }

    // Perform multiple get operations and verify results
    for (let i = 0; i < testData.length; i++) {
      await new Promise<void>((resolve) => {
        cookieCache.get(`testKey${i}`, 'testStore', (result: CacheResult | undefined) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(testData[i]);
          log(`Get operation ${i + 1} verified`);
          resolve();
        });
      });
    }
  });

  it('should handle overwriting existing keys', async () => {
    log('Starting test: should handle overwriting existing keys');
    const initialData: StringValue = { type: 'string', value: 'Initial data' };
    const updatedData: StringValue = { type: 'string', value: 'Updated data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', initialData, expirationDate);
    log('Initial data set');

    cookieCache.set('testKey', 'testStore', updatedData, expirationDate);
    log('Data updated');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(updatedData);
        log('Updated data verified');
        resolve();
      });
    });
  });

  it('should handle interleaved set and get operations', async () => {
    log('Starting test: should handle interleaved set and get operations');
    const testData: StringValue[] = [
      { type: 'string', value: 'Test data 1' },
      { type: 'string', value: 'Test data 2' },
      { type: 'string', value: 'Test data 3' },
    ];
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    for (let i = 0; i < testData.length; i++) {
      cookieCache.set(`testKey${i}`, 'testStore', testData[i], expirationDate);
      log(`Set operation ${i + 1} completed`);

      await new Promise<void>((resolve) => {
        cookieCache.get(`testKey${i}`, 'testStore', (result: CacheResult | undefined) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(testData[i]);
          log(`Get operation ${i + 1} verified`);
          resolve();
        });
      });
    }
  });
});
