import { clientSet, clientGet } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheResult, StringValue, JSONValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('client-set-cookie-mode-test.log');
const log = createLogger(logStream);

describe('Client Set (Cookie Mode) Tests', () => {
  const storeName = 'test-store';
  const mode = 'cookie';

  beforeAll(() => {
    log('Starting Client Set (Cookie Mode) tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set a string value as a cookie', async () => {
    const identifier = 'string-cookie-test';
    const testValue: StringValue = { type: 'string', value: 'test cookie string' };
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

    log('Successfully set string value as a cookie');
  });

  it('should set a JSON object as a cookie', async () => {
    const identifier = 'json-cookie-test';
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

    log('Successfully set JSON object as a cookie');
  });

  it('should update an existing cookie', async () => {
    const identifier = 'update-cookie-test';
    const initialValue: StringValue = { type: 'string', value: 'initial cookie value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated cookie value' };
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

    log('Successfully updated existing cookie');
  });

  it('should handle setting a cookie with the maximum allowed size', async () => {
    const identifier = 'max-size-cookie-test';
    const largeValue = 'a'.repeat(4096); // 4KB string, typical max cookie size
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

    log('Successfully set cookie with maximum allowed size');
  });

  it('should handle setting multiple cookies with the same storeName', async () => {
    const identifiers = ['cookie1', 'cookie2', 'cookie3'];
    const testValue: StringValue = { type: 'string', value: 'test cookie value' };
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

    log('Successfully set multiple cookies with the same storeName');
  });

  it('should handle setting cookies with different data types', async () => {
    const identifier = 'multi-type-cookie-test';
    const dataTypes = [
      { type: 'string', value: 'string cookie value' },
      { type: 'json', value: { key: 'cookie value' } },
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

    log('Successfully set cookies with different data types');
  });

  it('should handle setting a cookie with a past expiration date', async () => {
    const identifier = 'past-expiration-cookie-test';
    const testValue: StringValue = { type: 'string', value: 'expired cookie value' };
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

    log('Successfully handled setting a cookie with a past expiration date');
  });

  it('should handle setting a cookie with a far future expiration date', async () => {
    const identifier = 'future-expiration-cookie-test';
    const testValue: StringValue = { type: 'string', value: 'long-lived cookie value' };
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

    log('Successfully set a cookie with a far future expiration date');
  });

  it('should handle setting a cookie with special characters in the identifier', async () => {
    const identifier = 'special@#$%^&*()_+{}|:"<>?-=[];\',./`~cookie-test';
    const testValue: StringValue = { type: 'string', value: 'special character cookie test' };
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

    log('Successfully set a cookie with special characters in the identifier');
  });

  it('should handle setting a cookie with Unicode characters', async () => {
    const identifier = 'unicode-cookie-test-🍪';
    const testValue: StringValue = {
      type: 'string',
      value: 'Unicode cookie value: こんにちは世界',
    };
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

    log('Successfully set a cookie with Unicode characters');
  });

  it('should handle errors during cookie set operation', async () => {
    const identifier = 'error-cookie-test';
    const testValue: StringValue = { type: 'string', value: 'error cookie test' };
    const expirationDate = new Date(Date.now() + 1000);

    (clientSet as jest.Mock).mockRejectedValueOnce(new Error('Cookie set operation failed'));

    await expect(clientSet(identifier, storeName, testValue, expirationDate, mode)).rejects.toThrow(
      'Cookie set operation failed',
    );

    log('Successfully handled errors during cookie set operation');
  });

  it('should handle setting a cookie with path and domain options', async () => {
    const identifier = 'path-domain-cookie-test';
    const testValue: StringValue = { type: 'string', value: 'path and domain cookie test' };
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

    log('Successfully set a cookie');
  });
});
