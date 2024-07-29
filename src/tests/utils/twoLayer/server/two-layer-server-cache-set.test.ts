import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, ListValue, HashValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Set Operation', () => {
  let serverStorage: ServerStorage;
  let cache: TwoLayerServerCache;
  let defaultConfig: CacheConfig;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    defaultConfig = mockCacheConfig;

    cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    logStream = createLogStream('two-layer-server-cache-set-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should set string value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);
    log('String value set successfully');
  });

  it('should set list value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: ListValue = { type: 'list', value: ['item1', 'item2'] };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);
    log('List value set successfully');
  });

  it('should set hash value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);
    log('Hash value set successfully');
  });

  it('should overwrite existing value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const initialData: StringValue = { type: 'string', value: 'initialValue' };
    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, initialData, expirationDate);
    await cache.set(testId, testStore, updatedData, expirationDate);

    expect(serverStorage.set).toHaveBeenLastCalledWith(
      testId,
      testStore,
      updatedData,
      expirationDate,
    );
    log('Existing value overwritten successfully');
  });

  it('should handle server storage errors', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const error = new Error('Storage error');
    (serverStorage.set as jest.Mock).mockRejectedValue(error);

    await expect(cache.set(testId, testStore, testData, expirationDate)).rejects.toThrow(
      'Storage error',
    );
    log('Server storage error handled correctly');
  });

  it('should trigger subscribed listeners on set', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);
    const listener = jest.fn();

    cache.subscribeToUpdates(testId, testStore, listener);

    await cache.set(testId, testStore, testData, expirationDate);

    expect(listener).toHaveBeenCalledWith(testData);
    log('Subscribed listeners triggered on set');
  });

  it('should respect cache size limit', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = {
      type: 'string',
      value: 'a'.repeat(defaultConfig.cacheSize + 1),
    };
    const expirationDate = new Date(Date.now() + 1000);

    await expect(cache.set(testId, testStore, testData, expirationDate)).rejects.toThrow(
      'Exceeds cache size limit',
    );
    log('Cache size limit respected');
  });

  it('should update last updated date', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const initialDate = new Date(Date.now() - 1000);
    (serverStorage.get as jest.Mock).mockResolvedValue({
      lastUpdatedDate: initialDate,
    });

    await cache.set(testId, testStore, testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(
      testId,
      testStore,
      testData,
      expirationDate,
      expect.objectContaining({
        lastUpdatedDate: expect.any(Date),
      }),
    );

    const setCall = (serverStorage.set as jest.Mock).mock.calls[0];
    const updatedDate = setCall[4].lastUpdatedDate;
    expect(updatedDate.getTime()).toBeGreaterThan(initialDate.getTime());

    log('Last updated date updated correctly');
  });

  it('should reset hit counts on set', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    (serverStorage.get as jest.Mock).mockResolvedValue({
      getHitCount: 5,
      setHitCount: 3,
    });

    await cache.set(testId, testStore, testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(
      testId,
      testStore,
      testData,
      expirationDate,
      expect.objectContaining({
        getHitCount: 0,
        setHitCount: 1,
      }),
    );

    log('Hit counts reset correctly on set');
  });

  it('should handle setting data with immediate expiration', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const immediateExpirationDate = new Date();

    await cache.set(testId, testStore, testData, immediateExpirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(
      testId,
      testStore,
      testData,
      immediateExpirationDate,
    );

    // Attempt to get the immediately expired data
    (serverStorage.get as jest.Mock).mockResolvedValue({
      value: testData,
      expirationDate: immediateExpirationDate,
    });

    const result = await cache.get(testId, testStore);
    expect(result).toBeUndefined();

    log('Immediately expired data handled correctly');
  });

  it('should not allow setting data with past expiration date', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const pastExpirationDate = new Date(Date.now() - 1000);

    await expect(cache.set(testId, testStore, testData, pastExpirationDate)).rejects.toThrow(
      'Invalid expiration date',
    );

    log('Setting data with past expiration date prevented');
  });

  it('should handle setting large data close to cache size limit', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = {
      type: 'string',
      value: 'a'.repeat(defaultConfig.cacheSize - 1),
    };
    const expirationDate = new Date(Date.now() + 1000);

    await expect(cache.set(testId, testStore, testData, expirationDate)).resolves.not.toThrow();

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);

    log('Large data close to cache size limit set successfully');
  });

  it('should maintain data integrity across multiple set operations', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData1: StringValue = { type: 'string', value: 'testValue1' };
    const testData2: ListValue = { type: 'list', value: ['item1', 'item2'] };
    const testData3: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, testData1, expirationDate);
    await cache.set(testId, testStore, testData2, expirationDate);
    await cache.set(testId, testStore, testData3, expirationDate);

    expect(serverStorage.set).toHaveBeenNthCalledWith(
      1,
      testId,
      testStore,
      testData1,
      expirationDate,
    );
    expect(serverStorage.set).toHaveBeenNthCalledWith(
      2,
      testId,
      testStore,
      testData2,
      expirationDate,
    );
    expect(serverStorage.set).toHaveBeenNthCalledWith(
      3,
      testId,
      testStore,
      testData3,
      expirationDate,
    );

    // Mock the get operation to return the last set value
    (serverStorage.get as jest.Mock).mockResolvedValue({
      value: testData3,
      expirationDate,
    });

    const result = await cache.get(testId, testStore);
    expect(result?.value).toEqual(testData3);

    log('Data integrity maintained across multiple set operations');
  });

  it('should handle concurrent set operations', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData1: StringValue = { type: 'string', value: 'testValue1' };
    const testData2: StringValue = { type: 'string', value: 'testValue2' };
    const expirationDate = new Date(Date.now() + 1000);

    const setOperation1 = cache.set(testId, testStore, testData1, expirationDate);
    const setOperation2 = cache.set(testId, testStore, testData2, expirationDate);

    await Promise.all([setOperation1, setOperation2]);

    expect(serverStorage.set).toHaveBeenCalledTimes(2);
    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData1, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData2, expirationDate);

    log('Concurrent set operations handled correctly');
  });
});
