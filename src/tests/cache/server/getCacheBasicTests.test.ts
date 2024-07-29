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

describe('ServerCache Basic Get Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('get-cache-basic-tests.log', 'server');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache Basic Get tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should return the correct value for a cached item', async () => {
    log('Starting test: should return the correct value for a cached item');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value: DataValue = { type: 'string', value: 'Test value' };

    await serverCache.set(identifier, storeName, value, new Date(Date.now() + 3600000));

    const result = await serverCache.get(identifier, storeName);

    expect(result.value).toEqual(value);

    log('Successfully retrieved the correct value for a cached item');
  });

  it('should return undefined for a non-existent item', async () => {
    log('Starting test: should return undefined for a non-existent item');
    const identifier = 'non-existent-item';
    const storeName = 'test-store';

    const result = await serverCache.get(identifier, storeName);

    expect(result.value).toBeUndefined();

    log('Successfully returned undefined for a non-existent item');
  });

  it('should handle different data types correctly', async () => {
    log('Starting test: should handle different data types correctly');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const stringValue: DataValue = { type: 'string', value: 'Test string' };
    const numberValue: DataValue = { type: 'number', value: 42 };
    const booleanValue: DataValue = { type: 'boolean', value: true };
    const nullValue: DataValue = { type: 'null', value: null };
    const undefinedValue: DataValue = { type: 'undefined', value: undefined };

    await serverCache.set(identifier, storeName, stringValue, new Date(Date.now() + 3600000));
    let result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(stringValue);

    await serverCache.set(identifier, storeName, numberValue, new Date(Date.now() + 3600000));
    result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(numberValue);

    await serverCache.set(identifier, storeName, booleanValue, new Date(Date.now() + 3600000));
    result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(booleanValue);

    await serverCache.set(identifier, storeName, nullValue, new Date(Date.now() + 3600000));
    result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(nullValue);

    await serverCache.set(identifier, storeName, undefinedValue, new Date(Date.now() + 3600000));
    result = await serverCache.get(identifier, storeName);
    expect(result.value).toEqual(undefinedValue);

    log('Successfully handled different data types correctly');
  });

  it('should retrieve the correct item from the specified store', async () => {
    log('Starting test: should retrieve the correct item from the specified store');
    const identifier = 'test-item';
    const storeName1 = 'test-store-1';
    const storeName2 = 'test-store-2';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };

    await serverCache.set(identifier, storeName1, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName2, value2, new Date(Date.now() + 3600000));

    const result1 = await serverCache.get(identifier, storeName1);
    const result2 = await serverCache.get(identifier, storeName2);

    expect(result1.value).toEqual(value1);
    expect(result2.value).toEqual(value2);

    log('Successfully retrieved the correct item from the specified store');
  });
});
