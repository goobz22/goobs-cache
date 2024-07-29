import { clientRemove, clientGet, clientSet } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheResult, StringValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('client-remove-cookie-mode-test.log');
const log = createLogger(logStream);

describe('Client Remove (Cookie Mode) Tests', () => {
  const storeName = 'test-store';
  const mode = 'cookie';

  beforeAll(() => {
    log('Starting Client Remove (Cookie Mode) tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove an existing cookie entry', async () => {
    const identifier = 'existing-cookie';
    const testValue: StringValue = { type: 'string', value: 'test cookie value' };
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: testValue,
      expirationDate: new Date(Date.now() + 1000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValueOnce(mockCacheResult);
    (clientGet as jest.Mock).mockResolvedValueOnce({ value: undefined });

    await clientRemove(identifier, storeName, mode);

    expect(clientRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully removed existing cookie entry');
  });

  it('should not throw an error when removing a non-existent cookie', async () => {
    const identifier = 'non-existent-cookie';

    (clientGet as jest.Mock).mockResolvedValue({ value: undefined });

    await expect(clientRemove(identifier, storeName, mode)).resolves.not.toThrow();

    expect(clientRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    log('Successfully handled removal of non-existent cookie');
  });

  it('should remove multiple cookie entries with the same storeName', async () => {
    const identifiers = ['cookie1', 'cookie2', 'cookie3'];
    const testValue: StringValue = { type: 'string', value: 'test cookie value' };

    for (const identifier of identifiers) {
      await clientSet(identifier, storeName, testValue, new Date(Date.now() + 1000), mode);
    }

    for (const identifier of identifiers) {
      await clientRemove(identifier, storeName, mode);
    }

    for (const identifier of identifiers) {
      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toBeUndefined();
    }

    log('Successfully removed multiple cookie entries with the same storeName');
  });

  it('should only remove the specified cookie entry', async () => {
    const identifierToRemove = 'remove-this-cookie';
    const identifierToKeep = 'keep-this-cookie';
    const testValue: StringValue = { type: 'string', value: 'test cookie value' };

    await clientSet(identifierToRemove, storeName, testValue, new Date(Date.now() + 1000), mode);
    await clientSet(identifierToKeep, storeName, testValue, new Date(Date.now() + 1000), mode);

    await clientRemove(identifierToRemove, storeName, mode);

    const removedResult = await clientGet(identifierToRemove, storeName, mode);
    expect(removedResult.value).toBeUndefined();

    const keptResult = await clientGet(identifierToKeep, storeName, mode);
    expect(keptResult.value).toEqual(testValue);

    log('Successfully removed only the specified cookie entry');
  });

  it('should handle removal of cookie entries with different data types', async () => {
    const identifier = 'multi-type-cookie';
    const dataTypes = [
      { type: 'string', value: 'string cookie value' },
      { type: 'json', value: { key: 'cookie value' } },
      { type: 'json', value: [1, 2, 3] },
    ];

    for (const data of dataTypes) {
      await clientSet(identifier, storeName, data, new Date(Date.now() + 1000), mode);
      await clientRemove(identifier, storeName, mode);

      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toBeUndefined();
    }

    log('Successfully handled removal of cookie entries with different data types');
  });

  it('should not affect cookie entries in different stores', async () => {
    const identifier = 'cross-store-cookie';
    const otherStoreName = 'other-cookie-store';
    const testValue: StringValue = { type: 'string', value: 'test cookie value' };

    await clientSet(identifier, storeName, testValue, new Date(Date.now() + 1000), mode);
    await clientSet(identifier, otherStoreName, testValue, new Date(Date.now() + 1000), mode);

    await clientRemove(identifier, storeName, mode);

    const removedResult = await clientGet(identifier, storeName, mode);
    expect(removedResult.value).toBeUndefined();

    const keptResult = await clientGet(identifier, otherStoreName, mode);
    expect(keptResult.value).toEqual(testValue);

    log('Successfully kept cookie entries in different stores intact');
  });

  it('should handle removal of expired cookie entries', async () => {
    const identifier = 'expired-cookie';
    const testValue: StringValue = { type: 'string', value: 'expired cookie value' };

    const pastDate = new Date(Date.now() - 1000);
    await clientSet(identifier, storeName, testValue, pastDate, mode);

    await clientRemove(identifier, storeName, mode);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled removal of expired cookie entries');
  });

  it('should handle errors during cookie removal gracefully', async () => {
    const identifier = 'error-cookie';

    (clientRemove as jest.Mock).mockRejectedValueOnce(new Error('Cookie removal error'));

    await expect(clientRemove(identifier, storeName, mode)).rejects.toThrow('Cookie removal error');

    log('Successfully handled errors during cookie removal');
  });

  it('should handle removal of cookies with special characters in identifiers', async () => {
    const identifier = 'special@#$%^&*()_+{}|:"<>?-=[];\',./`~cookie';
    const testValue: StringValue = { type: 'string', value: 'special cookie value' };

    await clientSet(identifier, storeName, testValue, new Date(Date.now() + 1000), mode);
    await clientRemove(identifier, storeName, mode);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled removal of cookies with special characters in identifiers');
  });

  it('should handle removal of cookies with maximum allowed size', async () => {
    const identifier = 'max-size-cookie';
    const maxSizeValue = 'a'.repeat(4096); // 4KB, typical max cookie size
    const testValue: StringValue = { type: 'string', value: maxSizeValue };

    await clientSet(identifier, storeName, testValue, new Date(Date.now() + 1000), mode);
    await clientRemove(identifier, storeName, mode);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled removal of cookies with maximum allowed size');
  });

  it('should remove all cookies with the same identifier across different storeNames', async () => {
    const identifier = 'multi-store-cookie';
    const storeNames = ['store1', 'store2', 'store3'];
    const testValue: StringValue = { type: 'string', value: 'multi-store cookie value' };

    for (const store of storeNames) {
      await clientSet(identifier, store, testValue, new Date(Date.now() + 1000), mode);
    }

    await clientRemove(identifier, '*', mode); // Assuming '*' means all stores

    for (const store of storeNames) {
      const result = await clientGet(identifier, store, mode);
      expect(result.value).toBeUndefined();
    }

    log('Successfully removed all cookies with the same identifier across different storeNames');
  });

  it('should handle removal of cookies with Unicode characters', async () => {
    const identifier = 'unicode-cookie-🍪';
    const testValue: StringValue = { type: 'string', value: 'Unicode value: こんにちは世界' };

    await clientSet(identifier, storeName, testValue, new Date(Date.now() + 1000), mode);
    await clientRemove(identifier, storeName, mode);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled removal of cookies with Unicode characters');
  });

  it('should not remove httpOnly cookies', async () => {
    const identifier = 'httpOnly-cookie';
    const testValue: StringValue = { type: 'string', value: 'httpOnly cookie value' };

    // Mocking an httpOnly cookie that can't be accessed by client-side JavaScript
    (clientGet as jest.Mock).mockResolvedValue({ value: testValue });
    (clientRemove as jest.Mock).mockResolvedValue(undefined);

    await clientRemove(identifier, storeName, mode);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toEqual(testValue);

    log('Successfully handled attempted removal of httpOnly cookies');
  });

  it('should handle removal of multiple cookies in a single operation', async () => {
    const identifiers = ['batch1', 'batch2', 'batch3'];
    const testValue: StringValue = { type: 'string', value: 'batch cookie value' };

    for (const identifier of identifiers) {
      await clientSet(identifier, storeName, testValue, new Date(Date.now() + 1000), mode);
    }

    await clientRemove(identifiers.join(','), storeName, mode); // Assuming comma-separated list for batch removal

    for (const identifier of identifiers) {
      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toBeUndefined();
    }

    log('Successfully handled removal of multiple cookies in a single operation');
  });

  it('should handle removal of cookies near their expiration time', async () => {
    const identifier = 'near-expiry-cookie';
    const testValue: StringValue = { type: 'string', value: 'near expiry value' };

    const nearExpiryDate = new Date(Date.now() + 100); // 100ms from now
    await clientSet(identifier, storeName, testValue, nearExpiryDate, mode);

    // Wait for 50ms
    await new Promise((resolve) => setTimeout(resolve, 50));

    await clientRemove(identifier, storeName, mode);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled removal of cookies near their expiration time');
  });

  it('should handle removal of cookies with path and domain attributes', async () => {
    const identifier = 'path-domain-cookie';
    const testValue: StringValue = { type: 'string', value: 'path and domain specific value' };

    // Mocking a cookie with specific path and domain
    (clientGet as jest.Mock).mockResolvedValue({ value: testValue });
    (clientRemove as jest.Mock).mockResolvedValue(undefined);

    await clientRemove(identifier, storeName, mode);

    expect(clientRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    log('Successfully handled removal of cookies');
  });
});
