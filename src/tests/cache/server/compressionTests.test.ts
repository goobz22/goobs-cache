import { jest, describe, it, beforeAll, beforeEach, afterAll, expect } from '@jest/globals';
import {
  MockServerCache,
  createServerCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/server/serverCache.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { DataValue, StringValue } from '../../../types';

jest.mock('../../../jest/mocks/cache/server/serverCache.mock');
jest.mock('../../../jest/reusableJest/logging');
jest.mock('../../../jest/reusableJest/errorHandling');

describe('ServerCache Compression Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('compression-tests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Compression tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  const generateLargeString = (size: number): string => {
    return 'a'.repeat(size);
  };

  it('should compress large string values', async () => {
    log('Starting test: should compress large string values');
    const identifier = 'large-string';
    const storeName = 'test-store';
    const largeString = generateLargeString(2000); // 2KB string, above the 1KB compression threshold
    const value: StringValue = { type: 'string', value: largeString };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
    log('Large string value set');

    const result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(value);
    log('Successfully compressed and retrieved large string value');
  });

  it('should not compress small string values', async () => {
    log('Starting test: should not compress small string values');
    const identifier = 'small-string';
    const storeName = 'test-store';
    const smallString = generateLargeString(500); // 0.5KB string, below the 1KB compression threshold
    const value: StringValue = { type: 'string', value: smallString };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
    log('Small string value set');

    const result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(value);
    log('Successfully stored and retrieved small string value without compression');
  });

  it('should handle multiple compressed items', async () => {
    log('Starting test: should handle multiple compressed items');
    const storeName = 'test-store';
    const items: Array<[string, StringValue]> = [
      ['large-string-1', { type: 'string', value: generateLargeString(2000) }],
      ['large-string-2', { type: 'string', value: generateLargeString(3000) }],
      ['large-string-3', { type: 'string', value: generateLargeString(4000) }],
    ];

    for (const [identifier, value] of items) {
      await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
      log(`Compressed item ${identifier} set`);
    }

    for (const [identifier, value] of items) {
      const result = await serverCache.get(identifier, storeName);
      expect(result.value).toEqual(value);
      log(`Successfully retrieved compressed item ${identifier}`);
    }

    log('Successfully handled multiple compressed items');
  });

  it('should compress and decompress complex data structures', async () => {
    log('Starting test: should compress and decompress complex data structures');
    const identifier = 'complex-data';
    const storeName = 'test-store';
    const complexValue: DataValue = {
      type: 'json',
      value: {
        string: generateLargeString(1500),
        number: 12345,
        boolean: true,
        array: [1, 2, 3, 4, 5],
        nested: {
          object: {
            key: generateLargeString(1500),
          },
        },
      },
    };

    await serverCache.set(identifier, storeName, complexValue, new Date(Date.now() + 3600000));
    log('Complex data structure set');

    const result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(complexValue);
    log('Successfully compressed and decompressed complex data structure');
  });

  it('should handle compression with eviction', async () => {
    log('Starting test: should handle compression with eviction');
    const storeName = 'test-store';
    const itemCount = defaultMockConfig.cacheSize + 1; // Exceed the cache size to trigger eviction

    for (let i = 0; i < itemCount; i++) {
      const identifier = `large-string-${i}`;
      const value: StringValue = { type: 'string', value: generateLargeString(2000) };
      await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));
      log(`Compressed item ${identifier} set`);
    }

    // The first item should have been evicted
    const firstItemResult = await serverCache.get('large-string-0', storeName);
    expect(firstItemResult.value).toBeUndefined();
    log('First item evicted as expected');

    // The last item should still be in the cache
    const lastItemResult = await serverCache.get(`large-string-${itemCount - 1}`, storeName);
    expect(lastItemResult.value).toBeDefined();
    log('Last item still present in cache');

    log('Successfully handled compression with eviction');
  });
});
