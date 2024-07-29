import { clientGet } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheResult, StringValue, JSONValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('client-get-client-mode-test.log');
const log = createLogger(logStream);

describe('Client Get (Client Mode) Tests', () => {
  const storeName = 'test-store';
  const mode = 'client';

  beforeAll(() => {
    log('Starting Client Get (Client Mode) tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve a string value from the cache', async () => {
    const identifier = 'string-test';
    const testValue: StringValue = { type: 'string', value: 'test string' };
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toEqual(testValue);
    log(`Retrieved string value: ${JSON.stringify(result.value)}`);
  });

  it('should handle non-existent keys', async () => {
    const identifier = 'non-existent';
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 0,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toBeUndefined();
    log('Successfully handled non-existent key');
  });

  it('should handle cache retrieval errors', async () => {
    const identifier = 'error-test';
    (clientGet as jest.Mock).mockRejectedValue(new Error('Cache retrieval failed'));

    await expect(clientGet(identifier, storeName, mode)).rejects.toThrow('Cache retrieval failed');
    log('Successfully handled cache retrieval error');
  });

  it('should retrieve a complex object from the cache', async () => {
    const identifier = 'complex-test';
    const testValue: JSONValue = {
      type: 'json',
      value: {
        name: 'John Doe',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'Anytown',
        },
      },
    };
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toEqual(testValue);
    log(`Retrieved complex object: ${JSON.stringify(result.value)}`);
  });

  it('should handle retrieving a null value', async () => {
    const identifier = 'null-test';
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: null,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toBeNull();
    log('Successfully retrieved null value');
  });

  it('should retrieve an array from the cache', async () => {
    const identifier = 'array-test';
    const testValue: JSONValue = { type: 'json', value: [1, 2, 3, 4, 5] };
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toEqual(testValue);
    log(`Retrieved array: ${JSON.stringify(result.value)}`);
  });

  it('should handle retrieving a boolean value', async () => {
    const identifier = 'boolean-test';
    const testValue: JSONValue = { type: 'json', value: { booleanValue: true } };
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toEqual(testValue);
    log(`Retrieved boolean value: ${JSON.stringify(result.value)}`);
  });

  it('should handle retrieving a number value', async () => {
    const identifier = 'number-test';
    const testValue: JSONValue = { type: 'json', value: { numberValue: 42 } };
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toEqual(testValue);
    log(`Retrieved number value: ${JSON.stringify(result.value)}`);
  });

  it('should handle cache miss gracefully', async () => {
    const identifier = 'cache-miss';
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 0,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toBeUndefined();
    log('Successfully handled cache miss');
  });

  it('should retrieve a large string value from the cache', async () => {
    const identifier = 'large-string-test';
    const largeString = 'a'.repeat(1000000);
    const testValue: StringValue = { type: 'string', value: largeString };
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toEqual(testValue);
    log(`Retrieved large string value of length: ${(result.value as StringValue).value.length}`);
  });

  it('should handle retrieving an empty object', async () => {
    const identifier = 'empty-object-test';
    const testValue: JSONValue = { type: 'json', value: {} };
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toEqual(testValue);
    log('Successfully retrieved empty object');
  });

  it('should handle retrieving an empty array', async () => {
    const identifier = 'empty-array-test';
    const testValue: JSONValue = { type: 'json', value: [] };
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toEqual(testValue);
    log('Successfully retrieved empty array');
  });

  it('should handle retrieving a deeply nested object', async () => {
    const identifier = 'deep-nested-test';
    const testValue: JSONValue = {
      type: 'json',
      value: {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value',
              },
            },
          },
        },
      },
    };
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);

    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toEqual(testValue);
    log(`Retrieved deeply nested object: ${JSON.stringify(result.value)}`);
  });
});
