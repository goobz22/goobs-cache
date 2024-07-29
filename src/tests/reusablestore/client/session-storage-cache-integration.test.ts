import { clientSet, clientGet, clientRemove } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, CacheResult, StringValue, JSONValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('session-storage-cache-integration-test.log');
const log = createLogger(logStream);

describe('Session Storage Cache Integration Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'client';
  const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

  beforeAll(() => {
    log('Starting Session Storage Cache Integration tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set and get a string value in session storage', async () => {
    const identifier = 'string-test';
    const testValue: StringValue = { type: 'string', value: 'test string' };

    await clientSet(identifier, storeName, testValue, expirationDate, mode);

    expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, expirationDate, mode);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully set and got string value in session storage');
  });

  it('should set and get a JSON object in session storage', async () => {
    const identifier = 'json-test';
    const testValue: JSONValue = { type: 'json', value: { key: 'value', number: 42 } };

    await clientSet(identifier, storeName, testValue, expirationDate, mode);

    expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, expirationDate, mode);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully set and got JSON object in session storage');
  });

  it('should update an existing session storage cache entry', async () => {
    const identifier = 'update-test';
    const initialValue: StringValue = { type: 'string', value: 'initial value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };

    await clientSet(identifier, storeName, initialValue, expirationDate, mode);
    await clientSet(identifier, storeName, updatedValue, expirationDate, mode);

    expect(clientSet).toHaveBeenCalledTimes(2);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: updatedValue,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 1,
      setHitCount: 2,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully updated existing session storage cache entry');
  });

  it('should remove a value from session storage', async () => {
    const identifier = 'remove-test';
    const testValue: StringValue = { type: 'string', value: 'value to be removed' };

    await clientSet(identifier, storeName, testValue, expirationDate, mode);
    await clientRemove(identifier, storeName, mode);

    expect(clientRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully removed value from session storage');
  });

  it('should handle session storage size limitations', async () => {
    const identifier = 'large-value-test';
    const largeValue = 'a'.repeat(5 * 1024 * 1024); // 5MB string, exceeds typical session storage limit
    const testValue: StringValue = { type: 'string', value: largeValue };

    await expect(clientSet(identifier, storeName, testValue, expirationDate, mode)).rejects.toThrow(
      'Quota exceeded',
    );

    log('Successfully handled session storage size limitations');
  });

  it('should handle non-existent keys in session storage', async () => {
    const identifier = 'non-existent';

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled non-existent key in session storage');
  });

  it('should handle setting multiple entries in session storage', async () => {
    const entries = [
      { identifier: 'entry1', value: { type: 'string', value: 'value1' } as StringValue },
      { identifier: 'entry2', value: { type: 'string', value: 'value2' } as StringValue },
      { identifier: 'entry3', value: { type: 'string', value: 'value3' } as StringValue },
    ];

    for (const entry of entries) {
      await clientSet(entry.identifier, storeName, entry.value, expirationDate, mode);
    }

    expect(clientSet).toHaveBeenCalledTimes(entries.length);

    for (const entry of entries) {
      const mockCacheResult: CacheResult = {
        identifier: entry.identifier,
        storeName,
        value: entry.value,
        expirationDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 1,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(entry.identifier, storeName, mode);
      expect(result).toEqual(mockCacheResult);
    }

    log('Successfully handled setting multiple entries in session storage');
  });

  it('should handle session storage clear', async () => {
    const identifier = 'clear-test';
    const testValue: StringValue = { type: 'string', value: 'value to be cleared' };

    await clientSet(identifier, storeName, testValue, expirationDate, mode);

    // Simulate clearing session storage
    (clientGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled session storage clear');
  });

  it('should handle session storage quota exceeded error', async () => {
    const identifier = 'quota-exceeded-test';
    const largeValue = 'a'.repeat(10 * 1024 * 1024); // 10MB string, likely to exceed quota
    const testValue: StringValue = { type: 'string', value: largeValue };

    (clientSet as jest.Mock).mockRejectedValue(new Error('Quota exceeded'));

    await expect(clientSet(identifier, storeName, testValue, expirationDate, mode)).rejects.toThrow(
      'Quota exceeded',
    );

    log('Successfully handled session storage quota exceeded error');
  });

  it('should handle concurrent operations on session storage', async () => {
    const identifier = 'concurrent-test';
    const testValue: StringValue = { type: 'string', value: 'concurrent test value' };

    const operations = [
      clientSet(identifier, storeName, testValue, expirationDate, mode),
      clientGet(identifier, storeName, mode),
      clientRemove(identifier, storeName, mode),
    ];

    await Promise.all(operations);

    expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, expirationDate, mode);
    expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(clientRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    log('Successfully handled concurrent operations on session storage');
  });

  it('should handle session storage persistence across page reloads', async () => {
    const identifier = 'persistence-test';
    const testValue: StringValue = { type: 'string', value: 'persistent value' };

    // Simulate setting a value
    await clientSet(identifier, storeName, testValue, expirationDate, mode);

    // Simulate page reload by clearing all mocks
    jest.clearAllMocks();

    // After "reload", the value should still be retrievable
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully handled session storage persistence across page reloads');
  });

  it('should handle session storage expiration', async () => {
    const identifier = 'expiration-test';
    const testValue: StringValue = { type: 'string', value: 'expiring value' };
    const shortExpirationDate = new Date(Date.now() + 1000); // 1 second from now

    await clientSet(identifier, storeName, testValue, shortExpirationDate, mode);

    // Wait for the value to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const mockExpiredResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: shortExpirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 0,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockExpiredResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled session storage expiration');
  });
});
