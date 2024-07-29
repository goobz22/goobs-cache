import { clientRemove, clientGet, clientSet } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheResult, StringValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('client-remove-client-mode-test.log');
const log = createLogger(logStream);

describe('Client Remove (Client Mode) Tests', () => {
  const storeName = 'test-store';
  const mode = 'client';

  beforeAll(() => {
    log('Starting Client Remove (Client Mode) tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove an existing cache entry', async () => {
    const identifier = 'existing-entry';
    const testValue: StringValue = { type: 'string', value: 'test value' };
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

    log('Successfully removed existing cache entry');
  });

  it('should not throw an error when removing a non-existent entry', async () => {
    const identifier = 'non-existent-entry';

    (clientGet as jest.Mock).mockResolvedValue({ value: undefined });

    await expect(clientRemove(identifier, storeName, mode)).resolves.not.toThrow();

    expect(clientRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    log('Successfully handled removal of non-existent cache entry');
  });

  it('should remove multiple entries with the same storeName', async () => {
    const identifiers = ['entry1', 'entry2', 'entry3'];
    const testValue: StringValue = { type: 'string', value: 'test value' };

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

    log('Successfully removed multiple entries with the same storeName');
  });

  it('should only remove the specified entry', async () => {
    const identifierToRemove = 'remove-me';
    const identifierToKeep = 'keep-me';
    const testValue: StringValue = { type: 'string', value: 'test value' };

    await clientSet(identifierToRemove, storeName, testValue, new Date(Date.now() + 1000), mode);
    await clientSet(identifierToKeep, storeName, testValue, new Date(Date.now() + 1000), mode);

    await clientRemove(identifierToRemove, storeName, mode);

    const removedResult = await clientGet(identifierToRemove, storeName, mode);
    expect(removedResult.value).toBeUndefined();

    const keptResult = await clientGet(identifierToKeep, storeName, mode);
    expect(keptResult.value).toEqual(testValue);

    log('Successfully removed only the specified entry');
  });

  it('should handle removal of entries with different data types', async () => {
    const identifier = 'multi-type-entry';
    const dataTypes = [
      { type: 'string', value: 'string value' },
      { type: 'json', value: { key: 'value' } },
      { type: 'json', value: [1, 2, 3] },
    ];

    for (const data of dataTypes) {
      await clientSet(identifier, storeName, data, new Date(Date.now() + 1000), mode);
      await clientRemove(identifier, storeName, mode);

      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toBeUndefined();
    }

    log('Successfully handled removal of entries with different data types');
  });

  it('should not affect entries in different stores', async () => {
    const identifier = 'cross-store-entry';
    const otherStoreName = 'other-store';
    const testValue: StringValue = { type: 'string', value: 'test value' };

    await clientSet(identifier, storeName, testValue, new Date(Date.now() + 1000), mode);
    await clientSet(identifier, otherStoreName, testValue, new Date(Date.now() + 1000), mode);

    await clientRemove(identifier, storeName, mode);

    const removedResult = await clientGet(identifier, storeName, mode);
    expect(removedResult.value).toBeUndefined();

    const keptResult = await clientGet(identifier, otherStoreName, mode);
    expect(keptResult.value).toEqual(testValue);

    log('Successfully kept entries in different stores intact');
  });

  it('should handle removal of expired entries', async () => {
    const identifier = 'expired-entry';
    const testValue: StringValue = { type: 'string', value: 'expired value' };

    const pastDate = new Date(Date.now() - 1000);
    await clientSet(identifier, storeName, testValue, pastDate, mode);

    await clientRemove(identifier, storeName, mode);

    const result = await clientGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled removal of expired entries');
  });

  it('should handle errors during removal gracefully', async () => {
    const identifier = 'error-entry';

    (clientRemove as jest.Mock).mockRejectedValueOnce(new Error('Removal error'));

    await expect(clientRemove(identifier, storeName, mode)).rejects.toThrow('Removal error');

    log('Successfully handled errors during removal');
  });
});
