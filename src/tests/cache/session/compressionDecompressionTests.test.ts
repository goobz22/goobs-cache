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

// Mock compression and decompression
jest.mock('../../../utils/Compression.client', () => ({
  compressData: jest.fn((data: Uint8Array) => new Uint8Array([...data, 0, 1, 2])),
  decompressData: jest.fn((data: Uint8Array) => data.slice(0, -3)),
}));

describe('SessionStorageCache compression and decompression', () => {
  let sessionStorageCache: MockSessionStorageCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('compressionDecompressionTests.log', 'client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting SessionStorageCache compression and decompression tests...');
  });

  beforeEach(() => {
    sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    log('Test setup complete');
  });

  afterAll(() => {
    jest.clearAllMocks();
    closeLogStreams();
  });

  it('should correctly store and retrieve compressed data', async () => {
    log('Starting test: should correctly store and retrieve compressed data');
    const testData: DataValue = { type: 'string', value: 'test value' };
    const identifier = 'test-identifier';
    const storeName = 'test-store';

    sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Compression and decompression test passed');
  });

  it('should handle large data objects correctly', async () => {
    log('Starting test: should handle large data objects correctly');
    const largeData: DataValue = {
      type: 'json',
      value: { data: 'x'.repeat(1000000) },
    };
    const identifier = 'large-data-identifier';
    const storeName = 'large-data-store';

    sessionStorageCache.set(identifier, storeName, largeData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(largeData);
        resolve();
      });
    });

    log('Large data compression and decompression test passed');
  });

  it('should handle complex nested objects', async () => {
    log('Starting test: should handle complex nested objects');
    const complexData: DataValue = {
      type: 'json',
      value: {
        nested: {
          array: [1, 2, 3],
          object: { a: 1, b: 2 },
          string: 'nested string',
        },
        date: new Date().toISOString(),
      },
    };
    const identifier = 'complex-data-identifier';
    const storeName = 'complex-data-store';

    sessionStorageCache.set(identifier, storeName, complexData, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(complexData);
        resolve();
      });
    });

    log('Complex data compression and decompression test passed');
  });

  it('should handle multiple set and get operations', async () => {
    log('Starting test: should handle multiple set and get operations');
    const testData1: DataValue = { type: 'string', value: 'test value 1' };
    const testData2: DataValue = { type: 'number', value: 12345 };
    const identifier1 = 'test-identifier-1';
    const identifier2 = 'test-identifier-2';
    const storeName = 'test-store';

    sessionStorageCache.set(identifier1, storeName, testData1, new Date(Date.now() + 3600000));
    sessionStorageCache.set(identifier2, storeName, testData2, new Date(Date.now() + 3600000));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier1, storeName, (result1) => {
        expect(result1).toBeDefined();
        expect(result1?.value).toEqual(testData1);
      });

      sessionStorageCache.get(identifier2, storeName, (result2) => {
        expect(result2).toBeDefined();
        expect(result2?.value).toEqual(testData2);
        resolve();
      });
    });

    log('Multiple operations compression and decompression test passed');
  });
});
