import { jest } from '@jest/globals';
import { CacheResult, StringValue, NumberValue, BooleanValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';

describe('CookieCache basic set tests', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('basicSetTests.log', 'cookie');
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

  it('should set and retrieve a string value', async () => {
    log('Starting test: should set and retrieve a string value');
    const testData: StringValue = { type: 'string', value: 'Test data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', testData, expirationDate);
    log('String value set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('String value retrieved and verified');
        resolve();
      });
    });
  });

  it('should set and retrieve a number value', async () => {
    log('Starting test: should set and retrieve a number value');
    const testData: NumberValue = { type: 'number', value: 42 };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', testData, expirationDate);
    log('Number value set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Number value retrieved and verified');
        resolve();
      });
    });
  });

  it('should set and retrieve a boolean value', async () => {
    log('Starting test: should set and retrieve a boolean value');
    const testData: BooleanValue = { type: 'boolean', value: true };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', testData, expirationDate);
    log('Boolean value set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        log('Boolean value retrieved and verified');
        resolve();
      });
    });
  });

  it('should overwrite an existing value', async () => {
    log('Starting test: should overwrite an existing value');
    const initialData: StringValue = { type: 'string', value: 'Initial data' };
    const updatedData: StringValue = { type: 'string', value: 'Updated data' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    cookieCache.set('testKey', 'testStore', initialData, expirationDate);
    log('Initial value set in cache');

    cookieCache.set('testKey', 'testStore', updatedData, expirationDate);
    log('Updated value set in cache');

    await new Promise<void>((resolve) => {
      cookieCache.get('testKey', 'testStore', (result: CacheResult | undefined) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(updatedData);
        log('Updated value retrieved and verified');
        resolve();
      });
    });
  });
});
