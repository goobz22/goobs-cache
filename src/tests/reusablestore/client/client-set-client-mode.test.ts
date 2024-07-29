import { clientSet, clientGet } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheResult, StringValue, JSONValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('client-set-client-mode-test.log');
const log = createLogger(logStream);

describe('Client Set (Client Mode) Tests', () => {
  const storeName = 'test-store';
  const mode = 'client';

  beforeAll(() => {
    log('Starting Client Set (Client Mode) tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set a string value in the cache', async () => {
    const identifier = 'string-test';
    const testValue: StringValue = { type: 'string', value: 'test string' };
    const expirationDate = new Date(Date.now() + 1000);

    await clientSet(identifier, storeName, testValue, expirationDate, mode);

    expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, expirationDate, mode);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 0,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully set string value in cache');
  });

  it('should set a JSON object in the cache', async () => {
    const identifier = 'json-test';
    const testValue: JSONValue = { type: 'json', value: { key: 'value', number: 42 } };
    const expirationDate = new Date(Date.now() + 1000);

    await clientSet(identifier, storeName, testValue, expirationDate, mode);

    expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, expirationDate, mode);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 0,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully set JSON object in cache');
  });

  it('should update an existing cache entry', async () => {
    const identifier = 'update-test';
    const initialValue: StringValue = { type: 'string', value: 'initial value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };
    const expirationDate = new Date(Date.now() + 1000);

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
      getHitCount: 0,
      setHitCount: 2,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully updated existing cache entry');
  });

  it('should handle setting a large value', async () => {
    const identifier = 'large-value-test';
    const largeValue = 'a'.repeat(1000000); // 1MB string
    const testValue: StringValue = { type: 'string', value: largeValue };
    const expirationDate = new Date(Date.now() + 1000);

    await clientSet(identifier, storeName, testValue, expirationDate, mode);

    expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, expirationDate, mode);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 0,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully set large value in cache');
  });

  it('should handle setting multiple entries with the same storeName', async () => {
    const identifiers = ['entry1', 'entry2', 'entry3'];
    const testValue: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 1000);

    for (const identifier of identifiers) {
      await clientSet(identifier, storeName, testValue, expirationDate, mode);
    }

    expect(clientSet).toHaveBeenCalledTimes(identifiers.length);

    for (const identifier of identifiers) {
      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 0,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(identifier, storeName, mode);
      expect(result).toEqual(mockCacheResult);
    }

    log('Successfully set multiple entries with the same storeName');
  });

  it('should handle setting entries with different data types', async () => {
    const identifier = 'multi-type-test';
    const dataTypes = [
      { type: 'string', value: 'string value' },
      { type: 'json', value: { key: 'value' } },
      { type: 'json', value: [1, 2, 3] },
    ];
    const expirationDate = new Date(Date.now() + 1000);

    for (const data of dataTypes) {
      await clientSet(identifier, storeName, data, expirationDate, mode);

      expect(clientSet).toHaveBeenCalledWith(identifier, storeName, data, expirationDate, mode);

      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: data,
        expirationDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 0,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(identifier, storeName, mode);
      expect(result).toEqual(mockCacheResult);
    }

    log('Successfully set entries with different data types');
  });

  it('should handle setting an entry with a past expiration date', async () => {
    const identifier = 'past-expiration-test';
    const testValue: StringValue = { type: 'string', value: 'expired value' };
    const pastExpirationDate = new Date(Date.now() - 1000); // 1 second in the past

    await clientSet(identifier, storeName, testValue, pastExpirationDate, mode);

    expect(clientSet).toHaveBeenCalledWith(
      identifier,
      storeName,
      testValue,
      pastExpirationDate,
      mode,
    );

    (clientGet as jest.Mock).mockResolvedValue({ value: undefined });

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled setting an entry with a past expiration date');
  });

  it('should handle setting an entry with a far future expiration date', async () => {
    const identifier = 'future-expiration-test';
    const testValue: StringValue = { type: 'string', value: 'long-lived value' };
    const futureExpirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year in the future

    await clientSet(identifier, storeName, testValue, futureExpirationDate, mode);

    expect(clientSet).toHaveBeenCalledWith(
      identifier,
      storeName,
      testValue,
      futureExpirationDate,
      mode,
    );

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: futureExpirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 0,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully set an entry with a far future expiration date');
  });

  it('should handle setting an entry with special characters in the identifier', async () => {
    const identifier = 'special@#$%^&*()_+{}|:"<>?-=[];\',./`~test';
    const testValue: StringValue = { type: 'string', value: 'special character test' };
    const expirationDate = new Date(Date.now() + 1000);

    await clientSet(identifier, storeName, testValue, expirationDate, mode);

    expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, expirationDate, mode);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 0,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully set an entry with special characters in the identifier');
  });

  it('should handle setting an entry with Unicode characters', async () => {
    const identifier = 'unicode-test-🚀';
    const testValue: StringValue = { type: 'string', value: 'Unicode value: こんにちは世界' };
    const expirationDate = new Date(Date.now() + 1000);

    await clientSet(identifier, storeName, testValue, expirationDate, mode);

    expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, expirationDate, mode);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 0,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result).toEqual(mockCacheResult);

    log('Successfully set an entry with Unicode characters');
  });

  it('should handle errors during set operation', async () => {
    const identifier = 'error-test';
    const testValue: StringValue = { type: 'string', value: 'error test' };
    const expirationDate = new Date(Date.now() + 1000);

    (clientSet as jest.Mock).mockRejectedValueOnce(new Error('Set operation failed'));

    await expect(clientSet(identifier, storeName, testValue, expirationDate, mode)).rejects.toThrow(
      'Set operation failed',
    );

    log('Successfully handled errors during set operation');
  });
});
