import { jest, describe, it, beforeEach, afterAll, expect } from '@jest/globals';
import {
  MockSessionStorageCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/session.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { DataValue } from '../../../types';

describe('SessionStorageCache error handling tests', () => {
  let sessionStorageCache: MockSessionStorageCache;
  let log: (message: string) => void = () => {};

  beforeEach(async () => {
    const logFunction = await runTestsWithLogging('errorHandlingTests.log', 'client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);

    sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should handle errors when setting invalid data', async () => {
    log('Starting test: should handle errors when setting invalid data');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const invalidData = { type: 'invalid' as 'string', value: {} };
    console.error = jest.fn();

    await sessionStorageCache.set(
      identifier,
      storeName,
      invalidData as DataValue,
      new Date(Date.now() + 3600000),
    );

    expect(console.error).toHaveBeenCalled();
    log('Error handling for invalid data test passed');
  });

  it('should handle errors when getting non-existent data', async () => {
    log('Starting test: should handle errors when getting non-existent data');
    const identifier = 'non-existent-identifier';
    const storeName = 'test-store';

    sessionStorageCache.get(identifier, storeName, (result) => {
      expect(result).toBeUndefined();
    });

    log('Error handling for non-existent data test passed');
  });

  it('should handle errors when removing non-existent data', async () => {
    log('Starting test: should handle errors when removing non-existent data');
    const identifier = 'non-existent-identifier';
    const storeName = 'test-store';

    expect(() => {
      sessionStorageCache.remove(identifier, storeName);
    }).not.toThrow();

    log('Error handling for removing non-existent data test passed');
  });

  it('should handle errors when storage is full', async () => {
    log('Starting test: should handle errors when storage is full');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    jest.spyOn(sessionStorageCache, 'set').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    console.error = jest.fn();

    await sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));

    expect(console.error).toHaveBeenCalledWith('Failed to set session cache', expect.any(Error));
    log('Error handling for full storage test passed');
  });

  it('should handle errors when parsing corrupted cache data', async () => {
    log('Starting test: should handle errors when parsing corrupted cache data');
    console.error = jest.fn();

    jest.spyOn(console, 'error').mockImplementation(() => {});
    const errorMsg = 'Failed to parse session cache';

    jest.mocked(MockSessionStorageCache).mockImplementationOnce(() => {
      throw new Error('Invalid JSON');
    });

    expect(() => new MockSessionStorageCache(defaultMockConfig)).toThrow('Invalid JSON');
    expect(console.error).toHaveBeenCalledWith(errorMsg, expect.any(Error));

    log('Error handling for corrupted cache data test passed');
  });
});
