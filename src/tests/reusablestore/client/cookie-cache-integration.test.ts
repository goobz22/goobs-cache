import { clientSet, clientGet, clientRemove } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheResult, StringValue, JSONValue, CacheMode } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('cookie-cache-integration-test.log');
const log = createLogger(logStream);

describe('Cookie Cache Integration Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'cookie';

  beforeAll(() => {
    log('Starting Cookie Cache Integration tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set and get a string value in the cookie cache', async () => {
    const identifier = 'string-test';
    const testValue: StringValue = { type: 'string', value: 'test string' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

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

    log('Successfully set and got string value in cookie cache');
  });

  it('should set and get a JSON object in the cookie cache', async () => {
    const identifier = 'json-test';
    const testValue: JSONValue = { type: 'json', value: { key: 'value', number: 42 } };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

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

    log('Successfully set and got JSON object in cookie cache');
  });

  it('should update an existing cookie cache entry', async () => {
    const identifier = 'update-test';
    const initialValue: StringValue = { type: 'string', value: 'initial value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

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

    log('Successfully updated existing cookie cache entry');
  });

  it('should remove a value from the cookie cache', async () => {
    const identifier = 'remove-test';
    const testValue: StringValue = { type: 'string', value: 'value to be removed' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

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

    log('Successfully removed value from cookie cache');
  });

  it('should handle cookie size limitations', async () => {
    const identifier = 'large-value-test';
    const largeValue = 'a'.repeat(4096); // 4KB string, typical max cookie size
    const testValue: StringValue = { type: 'string', value: largeValue };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

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

    log('Successfully handled cookie size limitations');
  });

  it('should handle setting multiple cookies with different identifiers', async () => {
    const identifiers = ['cookie1', 'cookie2', 'cookie3'];
    const testValue: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

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
        getHitCount: 1,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(identifier, storeName, mode);
      expect(result).toEqual(mockCacheResult);
    }

    log('Successfully set and got multiple cookies with different identifiers');
  });

  it('should handle cookie expiration', async () => {
    const identifier = 'expiring-cookie';
    const testValue: StringValue = { type: 'string', value: 'expiring value' };
    const expirationDate = new Date(Date.now() + 1000); // 1 second from now

    await clientSet(identifier, storeName, testValue, expirationDate, mode);

    expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, expirationDate, mode);

    // Wait for the cookie to expire
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockExpiredResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    };

    (clientGet as jest.Mock).mockResolvedValue(mockExpiredResult);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled cookie expiration');
  });

  it('should handle setting a cookie with special characters in the value', async () => {
    const identifier = 'special-chars';
    const testValue: StringValue = {
      type: 'string',
      value: 'value with special chars: !@#$%^&*()_+{}[]|:;<>?,./',
    };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

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

    log('Successfully set and got cookie with special characters in the value');
  });

  it('should handle setting a cookie with Unicode characters', async () => {
    const identifier = 'unicode-cookie';
    const testValue: StringValue = { type: 'string', value: 'Unicode value: こんにちは世界' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

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

    log('Successfully set and got cookie with Unicode characters');
  });

  it('should handle errors during cookie set operation', async () => {
    const identifier = 'error-set-test';
    const testValue: StringValue = { type: 'string', value: 'error test value' };
    const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

    (clientSet as jest.Mock).mockRejectedValueOnce(new Error('Cookie set operation failed'));

    await expect(clientSet(identifier, storeName, testValue, expirationDate, mode)).rejects.toThrow(
      'Cookie set operation failed',
    );

    log('Successfully handled errors during cookie set operation');
  });

  it('should handle errors during cookie get operation', async () => {
    const identifier = 'error-get-test';

    (clientGet as jest.Mock).mockRejectedValueOnce(new Error('Cookie get operation failed'));

    await expect(clientGet(identifier, storeName, mode)).rejects.toThrow(
      'Cookie get operation failed',
    );

    log('Successfully handled errors during cookie get operation');
  });

  it('should handle errors during cookie remove operation', async () => {
    const identifier = 'error-remove-test';

    (clientRemove as jest.Mock).mockRejectedValueOnce(new Error('Cookie remove operation failed'));

    await expect(clientRemove(identifier, storeName, mode)).rejects.toThrow(
      'Cookie remove operation failed',
    );

    log('Successfully handled errors during cookie remove operation');
  });
});
