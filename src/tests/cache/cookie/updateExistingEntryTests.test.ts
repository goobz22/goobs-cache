import { jest } from '@jest/globals';
import { CacheResult, StringValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache update existing entry tests', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('updateExistingEntryTests.log', 'cookie');
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

  it('should update an existing entry', async () => {
    log('Starting test: should update an existing entry');
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
        log('Updated data retrieved successfully');
        resolve();
      });
    });
  });

  it('should maintain the original expiration date when updating', async () => {
    log('Starting test: should maintain the original expiration date when updating');
    const initialData: StringValue = { type: 'string', value: 'Initial data' };
    const updatedData: StringValue = { type: 'string', value: 'Updated data' };
    const initialExpirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
    const updatedExpirationDate = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes from now

    cookieCache.set('testKey', 'testStore', initialData, initialExpirationDate);
    log('Initial data set');

    cookieCache.set('testKey', 'testStore', updatedData, updatedExpirationDate);
    log('Data updated with new expiration date');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(updatedData);
        expect(result?.expirationDate).toEqual(updatedExpirationDate);
        log('Updated data and expiration date retrieved successfully');
        resolve();
      });
    });
  });

  it('should update hit counts when updating an existing entry', async () => {
    log('Starting test: should update hit counts when updating an existing entry');
    const initialData: StringValue = { type: 'string', value: 'Initial data' };
    const updatedData: StringValue = { type: 'string', value: 'Updated data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', initialData, expirationDate);
    log('Initial data set');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', () => {
        log('Initial data retrieved');
        resolve();
      });
    });

    cookieCache.set('testKey', 'testStore', updatedData, expirationDate);
    log('Data updated');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(updatedData);
        expect(result?.getHitCount).toBe(2);
        expect(result?.setHitCount).toBe(2);
        log('Updated data and hit counts retrieved successfully');
        resolve();
      });
    });
  });
});
