import { jest, describe, it, beforeAll, beforeEach, afterAll, expect } from '@jest/globals';
import {
  MockServerCache,
  createServerCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/server/serverCache.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { DataValue } from '../../../types';

jest.mock('../../../jest/mocks/cache/server/serverCache.mock');
jest.mock('../../../jest/reusableJest/logging');
jest.mock('../../../jest/reusableJest/errorHandling');

describe('ServerCache Multiple Set and Get Operations Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging(
      'multiple-set-get-operations-tests.log',
      'server',
    );
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Multiple Set and Get Operations tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should handle multiple set operations correctly', async () => {
    log('Starting test: should handle multiple set operations correctly');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };
    const value3: DataValue = { type: 'string', value: 'Test value 3' };

    await serverCache.set(identifier, storeName, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName, value2, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName, value3, new Date(Date.now() + 3600000));

    const result = await serverCache.get(identifier, storeName);

    expect(result.value).toEqual(value3);

    log('Successfully handled multiple set operations correctly');
  });

  it('should handle multiple get operations correctly', async () => {
    log('Starting test: should handle multiple get operations correctly');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    const result1 = await serverCache.get(identifier, storeName);
    const result2 = await serverCache.get(identifier, storeName);
    const result3 = await serverCache.get(identifier, storeName);

    expect(result1.value).toEqual(value);
    expect(result2.value).toEqual(value);
    expect(result3.value).toEqual(value);

    log('Successfully handled multiple get operations correctly');
  });

  it('should handle multiple set and get operations for different items', async () => {
    log('Starting test: should handle multiple set and get operations for different items');
    const identifier1 = 'test-item-1';
    const identifier2 = 'test-item-2';
    const identifier3 = 'test-item-3';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };
    const value3: DataValue = { type: 'string', value: 'Test value 3' };

    await serverCache.set(identifier1, storeName, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier2, storeName, value2, new Date(Date.now() + 3600000));
    await serverCache.set(identifier3, storeName, value3, new Date(Date.now() + 3600000));

    const result1 = await serverCache.get(identifier1, storeName);
    const result2 = await serverCache.get(identifier2, storeName);
    const result3 = await serverCache.get(identifier3, storeName);

    expect(result1.value).toEqual(value1);
    expect(result2.value).toEqual(value2);
    expect(result3.value).toEqual(value3);

    log('Successfully handled multiple set and get operations for different items');
  });

  it('should handle multiple set and get operations for different stores', async () => {
    log('Starting test: should handle multiple set and get operations for different stores');
    const identifier = 'test-item';
    const storeName1 = 'test-store-1';
    const storeName2 = 'test-store-2';
    const storeName3 = 'test-store-3';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };
    const value3: DataValue = { type: 'string', value: 'Test value 3' };

    await serverCache.set(identifier, storeName1, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName2, value2, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName3, value3, new Date(Date.now() + 3600000));

    const result1 = await serverCache.get(identifier, storeName1);
    const result2 = await serverCache.get(identifier, storeName2);
    const result3 = await serverCache.get(identifier, storeName3);

    expect(result1.value).toEqual(value1);
    expect(result2.value).toEqual(value2);
    expect(result3.value).toEqual(value3);

    log('Successfully handled multiple set and get operations for different stores');
  });
});
