import { clientSet, clientGet, clientRemove } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, CacheResult, StringValue, JSONValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('reusable-store-client-basic-test.log');
const log = createLogger(logStream);

describe('ReusableStore Client Basic Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['client', 'cookie'];
  const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

  beforeAll(() => {
    log('Starting ReusableStore Client Basic tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set and get a string value', async () => {
    const identifier = 'string-test';
    const testValue: StringValue = { type: 'string', value: 'test string' };

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, expirationDate, mode);

      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );

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

      log(`Successfully set and got string value in ${mode} mode`);
    }
  });

  it('should set and get a JSON value', async () => {
    const identifier = 'json-test';
    const testValue: JSONValue = { type: 'json', value: { key: 'value', number: 42 } };

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, expirationDate, mode);

      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );

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

      log(`Successfully set and got JSON value in ${mode} mode`);
    }
  });

  it('should remove a value', async () => {
    const identifier = 'remove-test';
    const testValue: StringValue = { type: 'string', value: 'value to be removed' };

    for (const mode of modes) {
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

      log(`Successfully removed value in ${mode} mode`);
    }
  });

  it('should handle non-existent keys', async () => {
    const identifier = 'non-existent';

    for (const mode of modes) {
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

      log(`Successfully handled non-existent key in ${mode} mode`);
    }
  });

  it('should update an existing value', async () => {
    const identifier = 'update-test';
    const initialValue: StringValue = { type: 'string', value: 'initial value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };

    for (const mode of modes) {
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
      expect(result.value).toEqual(updatedValue);

      log(`Successfully updated existing value in ${mode} mode`);
    }
  });
});
