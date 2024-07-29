import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import {
  MockSessionStorageCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/session.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { DataValue } from '../../../types';

jest.mock('../../../jest/mocks/cache/client/session.mock');
jest.mock('../../../jest/reusableJest/logging');
jest.mock('../../../jest/reusableJest/errorHandling');

describe('SessionStorageCache get basic tests', () => {
  let sessionStorageCache: MockSessionStorageCache;
  let log: (message: string) => void = () => {};

  beforeEach(async () => {
    jest.useFakeTimers();
    const logFunction = await runTestsWithLogging('getBasicTests.log', 'client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    log('Test setup complete');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    closeLogStreams();
  });

  it('should get a previously set string value', async () => {
    log('Starting test: should get a previously set string value');
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

    log('Get previously set string value test passed');
  });

  it('should get a previously set number value', async () => {
    log('Starting test: should get a previously set number value');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'number', value: 12345 };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Get previously set number value test passed');
  });

  it('should get a previously set boolean value', async () => {
    log('Starting test: should get a previously set boolean value');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'boolean', value: true };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Get previously set boolean value test passed');
  });

  it('should return undefined for non-existent key', async () => {
    log('Starting test: should return undefined for non-existent key');
    const identifier = 'non-existent-identifier';
    const storeName = 'test-store';

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeUndefined();
        resolve();
      });
    });

    log('Get non-existent key test passed');
  });

  it('should return undefined for expired key', async () => {
    log('Starting test: should return undefined for expired key');
    const identifier = 'expired-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'expired value' };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() - 1000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeUndefined();
        resolve();
      });
    });

    log('Get expired key test passed');
  });

  it('should get a complex object value', async () => {
    log('Starting test: should get a complex object value');
    const identifier = 'complex-identifier';
    const storeName = 'test-store';
    const testData: DataValue = {
      type: 'json',
      value: {
        name: 'John Doe',
        age: 30,
        isStudent: false,
        hobbies: ['reading', 'swimming'],
        address: {
          street: '123 Main St',
          city: 'Anytown',
          country: 'USA',
        },
      },
    };

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Get complex object value test passed');
  });
});
