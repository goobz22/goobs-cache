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

describe('ServerCache getByIdentifierAndStoreName Tests', () => {
  let serverCache: MockServerCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging(
      'get-by-identifier-and-store-name-tests.log',
      'server',
    );
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting ServerCache getByIdentifierAndStoreName tests...');
  });

  beforeEach(async () => {
    serverCache = await createServerCache(defaultMockConfig, 'testPassword');
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  it('should return all items with the specified identifier and store name', async () => {
    log('Starting test: should return all items with the specified identifier and store name');
    const identifier = 'test-item';
    const storeName = 'test-store';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };

    await serverCache.set(identifier, storeName, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName, value2, new Date(Date.now() + 3600000));

    const result = await serverCache.getByIdentifierAndStoreName(identifier, storeName);

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(value1);
    expect(result).toContainEqual(value2);

    log('Successfully retrieved all items with the specified identifier and store name');
  });

  it('should return an empty array if no items match the identifier and store name', async () => {
    log(
      'Starting test: should return an empty array if no items match the identifier and store name',
    );
    const identifier = 'test-item';
    const storeName = 'test-store';

    const result = await serverCache.getByIdentifierAndStoreName(identifier, storeName);

    expect(result).toHaveLength(0);

    log('Successfully returned an empty array when no items match the identifier and store name');
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
    await serverCache.set(identifier, storeName, numberValue, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName, booleanValue, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName, nullValue, new Date(Date.now() + 3600000));
    await serverCache.set(identifier, storeName, undefinedValue, new Date(Date.now() + 3600000));

    const result = await serverCache.getByIdentifierAndStoreName(identifier, storeName);

    expect(result).toHaveLength(5);
    expect(result).toContainEqual(stringValue);
    expect(result).toContainEqual(numberValue);
    expect(result).toContainEqual(booleanValue);
    expect(result).toContainEqual(nullValue);
    expect(result).toContainEqual(undefinedValue);

    log('Successfully handled different data types correctly');
  });

  it('should retrieve only the items matching the specified identifier and store name', async () => {
    log(
      'Starting test: should retrieve only the items matching the specified identifier and store name',
    );
    const identifier1 = 'test-item-1';
    const identifier2 = 'test-item-2';
    const storeName1 = 'test-store-1';
    const storeName2 = 'test-store-2';
    const value1: DataValue = { type: 'string', value: 'Test value 1' };
    const value2: DataValue = { type: 'string', value: 'Test value 2' };
    const value3: DataValue = { type: 'string', value: 'Test value 3' };
    const value4: DataValue = { type: 'string', value: 'Test value 4' };

    await serverCache.set(identifier1, storeName1, value1, new Date(Date.now() + 3600000));
    await serverCache.set(identifier1, storeName2, value2, new Date(Date.now() + 3600000));
    await serverCache.set(identifier2, storeName1, value3, new Date(Date.now() + 3600000));
    await serverCache.set(identifier2, storeName2, value4, new Date(Date.now() + 3600000));

    const result = await serverCache.getByIdentifierAndStoreName(identifier1, storeName1);

    expect(result).toHaveLength(1);
    expect(result).toContainEqual(value1);

    log('Successfully retrieved only the items matching the specified identifier and store name');
  });
});
