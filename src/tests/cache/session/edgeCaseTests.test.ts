import { jest, describe, it, beforeAll, beforeEach, afterAll, expect } from '@jest/globals';
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

describe('SessionStorageCache edge case tests', () => {
  let sessionStorageCache: MockSessionStorageCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('edgeCaseTests.log', 'client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting SessionStorageCache edge case tests...');
  });

  beforeEach(() => {
    sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    log('Test setup complete');
  });

  afterAll(() => {
    jest.clearAllMocks();
    closeLogStreams();
  });

  it('should handle empty string as identifier', async () => {
    log('Starting test: should handle empty string as identifier');
    const identifier = '';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Empty string identifier test passed');
  });

  it('should handle empty string as storeName', async () => {
    log('Starting test: should handle empty string as storeName');
    const identifier = 'test-identifier';
    const storeName = '';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Empty string storeName test passed');
  });

  it('should handle very long identifiers and storeNames', async () => {
    log('Starting test: should handle very long identifiers and storeNames');
    const identifier = 'a'.repeat(1000);
    const storeName = 'b'.repeat(1000);
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Very long identifiers and storeNames test passed');
  });

  it('should handle special characters in identifiers and storeNames', async () => {
    log('Starting test: should handle special characters in identifiers and storeNames');
    const identifier = '!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`';
    const storeName = '§±!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Special characters in identifiers and storeNames test passed');
  });

  it('should handle setting multiple values with the same identifier but different storeNames', async () => {
    log(
      'Starting test: should handle setting multiple values with the same identifier but different storeNames',
    );
    const identifier = 'test-identifier';
    const storeName1 = 'store1';
    const storeName2 = 'store2';
    const testData1: DataValue = { type: 'string', value: 'test value 1' };
    const testData2: DataValue = { type: 'string', value: 'test value 2' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName1, testData1, new Date(Date.now() + 3600000));
      resolve();
    });
    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName2, testData2, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName1, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData1);
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName2, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData2);
        resolve();
      });
    });

    log('Multiple values with same identifier but different storeNames test passed');
  });
});
