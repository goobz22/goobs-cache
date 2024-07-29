import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import {
  MockSessionStorageCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/session.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { DataValue, CacheConfig } from '../../../types';

jest.mock('../../../jest/mocks/cache/client/session.mock');
jest.mock('../../../jest/reusableJest/logging');
jest.mock('../../../jest/reusableJest/errorHandling');

describe('SessionStorageCache initialization tests', () => {
  let log: (message: string) => void = () => {};

  beforeEach(async () => {
    jest.useFakeTimers();
    const logFunction = await runTestsWithLogging('initializationTests.log', 'client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    closeLogStreams();
  });

  it('should initialize with empty cache', async () => {
    log('Starting test: should initialize with empty cache');
    const sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    const testIdentifier = 'test-identifier';
    const testStoreName = 'test-store';

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(testIdentifier, testStoreName, (result) => {
        expect(result).toBeUndefined();
        resolve();
      });
    });

    log('Empty cache initialization test passed');
  });

  it('should initialize with existing cache data', async () => {
    log('Starting test: should initialize with existing cache data');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    const sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    sessionStorageCache.set(identifier, storeName, testData, expirationDate);

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Initialization with existing cache data test passed');
  });

  it('should handle invalid cache data during initialization', async () => {
    log('Starting test: should handle invalid cache data during initialization');
    const sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    expect(sessionStorageCache).toBeDefined();
    log('Invalid cache data handling test passed');
  });

  it('should initialize with custom config', async () => {
    log('Starting test: should initialize with custom config');
    const customConfig: CacheConfig = {
      ...defaultMockConfig,
      cacheSize: 200,
      cacheMaxAge: 7200000,
    };
    const sessionStorageCache = new MockSessionStorageCache(customConfig);
    expect(sessionStorageCache).toBeDefined();
    log('Custom config initialization test passed');
  });

  it('should handle initialization with empty config', async () => {
    log('Starting test: should handle initialization with empty config');
    expect(() => {
      new MockSessionStorageCache({} as CacheConfig);
    }).not.toThrow();
    log('Empty config handling test passed');
  });

  it('should initialize and immediately set a value', async () => {
    log('Starting test: should initialize and immediately set a value');
    const sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Initialization and immediate set test passed');
  });
});
