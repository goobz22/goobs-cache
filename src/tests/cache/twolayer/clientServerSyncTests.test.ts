import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, CacheResult, DataValue } from '../../../types';
import {
  createLogStream,
  createLogger,
  setMockedGlobals,
  setupErrorHandling,
  mockCacheConfig,
  setupMockEncryptionAndCompression,
} from '../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('two-layer-cache-client-server-sync-tests.log');
const log: (message: string) => void = createLogger(logStream);

// Mock implementations
jest.mock('../../../utils/twoLayerCache.client');
jest.mock('../../../utils/twoLayerCache.server');

describe('TwoLayerCache Client-Server Sync Tests', () => {
  let twoLayerCache: TwoLayerCache;
  let mockConfig: CacheConfig;

  beforeAll(() => {
    setMockedGlobals();
    setupMockEncryptionAndCompression();
    mockConfig = { ...mockCacheConfig, encryptionPassword: 'testPassword' } as CacheConfig;
    log('Starting TwoLayerCache Client-Server Sync tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    twoLayerCache = new TwoLayerCache(mockConfig);
  });

  it('should synchronize data from server to client on get operation', async () => {
    log('\nTesting server to client sync on get operation...');
    const serverData: DataValue = { test: 'serverData' };

    // Simulate data present only on server
    jest.spyOn(twoLayerCache['serverCache'], 'get').mockResolvedValueOnce({
      identifier: 'testId',
      storeName: 'testStore',
      value: serverData,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    const result: CacheResult = await twoLayerCache.get('testId', 'testStore');
    log(`Retrieved data: ${JSON.stringify(result, null, 2)}`);
    expect(result.value).toEqual(serverData);

    // Verify client cache was updated
    const clientResult: CacheResult = await twoLayerCache.get('testId', 'testStore');
    log(`Retrieved data from client: ${JSON.stringify(clientResult, null, 2)}`);
    expect(clientResult.value).toEqual(serverData);
  });

  it('should propagate updates from client to server on set operation', async () => {
    log('\nTesting client to server sync on set operation...');
    const clientData: DataValue = { test: 'clientData' };
    const expirationDate: Date = new Date(Date.now() + 3600000);

    await twoLayerCache.set('testId', 'testStore', clientData, expirationDate);

    // Verify server cache was updated
    const serverSpy = jest.spyOn(twoLayerCache['serverCache'], 'set');
    expect(serverSpy).toHaveBeenCalledWith('testId', 'testStore', clientData, expirationDate);

    const result: CacheResult = await twoLayerCache.get('testId', 'testStore');
    log(`Retrieved data after set: ${JSON.stringify(result, null, 2)}`);
    expect(result.value).toEqual(clientData);
  });

  it('should handle conflicts between client and server data', async () => {
    log('\nTesting conflict handling between client and server data...');
    const clientData: DataValue = { test: 'clientData' };
    const serverData: DataValue = { test: 'serverData' };
    const expirationDate: Date = new Date(Date.now() + 3600000);

    // Set client data
    await twoLayerCache.set('testId', 'testStore', clientData, expirationDate);

    // Simulate server having different data
    jest.spyOn(twoLayerCache['serverCache'], 'get').mockResolvedValueOnce({
      identifier: 'testId',
      storeName: 'testStore',
      value: serverData,
      expirationDate: expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    const result: CacheResult = await twoLayerCache.get('testId', 'testStore');
    log(`Retrieved data after conflict: ${JSON.stringify(result, null, 2)}`);
    // Assuming server data takes precedence
    expect(result.value).toEqual(serverData);
  });

  it('should synchronize removal of data across client and server', async () => {
    log('\nTesting synchronization of data removal...');
    const testData: DataValue = { test: 'dataToRemove' };
    await twoLayerCache.set('testId', 'testStore', testData, new Date(Date.now() + 3600000));

    await twoLayerCache.remove('testId', 'testStore');

    // Verify data is removed from both client and server
    const clientResult: CacheResult = await twoLayerCache.get('testId', 'testStore');
    log(`Retrieved client data after removal: ${JSON.stringify(clientResult, null, 2)}`);
    expect(clientResult.value).toBeUndefined();

    const serverSpy = jest.spyOn(twoLayerCache['serverCache'], 'remove');
    expect(serverSpy).toHaveBeenCalledWith('testId', 'testStore');
  });

  it('should handle network failures during synchronization', async () => {
    log('\nTesting handling of network failures during sync...');
    const testData: DataValue = { test: 'networkFailureData' };

    // Simulate network failure
    jest
      .spyOn(twoLayerCache['serverCache'], 'set')
      .mockRejectedValueOnce(new Error('Network failure'));

    await expect(
      twoLayerCache.set('testId', 'testStore', testData, new Date(Date.now() + 3600000)),
    ).rejects.toThrow('Network failure');

    // Verify data is still available in client cache
    const clientResult: CacheResult = await twoLayerCache.get('testId', 'testStore');
    log(`Retrieved client data after network failure: ${JSON.stringify(clientResult, null, 2)}`);
    expect(clientResult.value).toEqual(testData);
  });

  it('should maintain data integrity during rapid updates', async () => {
    log('\nTesting data integrity during rapid updates...');
    const updateCount = 100;
    let latestData: DataValue | undefined;

    for (let i = 0; i < updateCount; i++) {
      latestData = { test: `rapidUpdateData${i}` };
      await twoLayerCache.set('testId', 'testStore', latestData, new Date(Date.now() + 3600000));
    }

    const result: CacheResult = await twoLayerCache.get('testId', 'testStore');
    log(`Retrieved data after rapid updates: ${JSON.stringify(result, null, 2)}`);
    expect(result.value).toEqual(latestData);
  });

  it('should synchronize data across multiple clients', async () => {
    log('\nTesting data synchronization across multiple clients...');
    const initialData: DataValue = { test: 'initialData' };
    const updatedData: DataValue = { test: 'updatedData' };

    // Simulate first client setting data
    await twoLayerCache.set('testId', 'testStore', initialData, new Date(Date.now() + 3600000));

    // Simulate second client updating data
    const secondClient = new TwoLayerCache(mockConfig);
    await secondClient.set('testId', 'testStore', updatedData, new Date(Date.now() + 3600000));

    // Verify first client gets updated data
    const result: CacheResult = await twoLayerCache.get('testId', 'testStore');
    log(
      `Retrieved data from first client after second client update: ${JSON.stringify(result, null, 2)}`,
    );
    expect(result.value).toEqual(updatedData);
  });

  it('should handle concurrent updates from multiple clients', async () => {
    log('\nTesting concurrent updates from multiple clients...');
    const clientCount = 5;
    const clients: TwoLayerCache[] = Array.from(
      { length: clientCount },
      () => new TwoLayerCache(mockConfig),
    );

    const updatePromises: Promise<void>[] = clients.map((client, index) =>
      client.set(
        'testId',
        'testStore',
        { test: `clientData${index}` },
        new Date(Date.now() + 3600000),
      ),
    );

    await Promise.all(updatePromises);

    // Verify all clients have the same final data
    const results: CacheResult[] = await Promise.all(
      clients.map((client) => client.get('testId', 'testStore')),
    );
    log(
      `Retrieved data from all clients after concurrent updates: ${JSON.stringify(results, null, 2)}`,
    );
    expect(new Set(results.map((r) => JSON.stringify(r.value))).size).toBe(1);
  });

  it('should synchronize large datasets efficiently', async () => {
    log('\nTesting synchronization of large datasets...');
    const largeData: DataValue = { test: 'A'.repeat(1024 * 1024) }; // 1MB of data

    const startTime = Date.now();
    await twoLayerCache.set('largeDataId', 'testStore', largeData, new Date(Date.now() + 3600000));
    const setDuration = Date.now() - startTime;

    const getStartTime = Date.now();
    const result: CacheResult = await twoLayerCache.get('largeDataId', 'testStore');
    const getDuration = Date.now() - getStartTime;

    log(`Set duration: ${setDuration}ms, Get duration: ${getDuration}ms`);
    log(
      `Retrieved large data (first 100 chars): ${JSON.stringify(result.value).substring(0, 100)}...`,
    );
    expect(result.value).toEqual(largeData);
    expect(setDuration).toBeLessThan(1000); // Adjust threshold as needed
    expect(getDuration).toBeLessThan(500); // Adjust threshold as needed
  });

  it('should maintain subscription updates across client-server sync', async () => {
    log('\nTesting subscription updates during client-server sync...');
    const initialData: DataValue = { test: 'initialSubscriptionData' };
    const updatedData: DataValue = { test: 'updatedSubscriptionData' };

    let updateCount = 0;
    const unsubscribe = twoLayerCache.subscribeToUpdates(
      'testId',
      'testStore',
      (data: DataValue) => {
        updateCount++;
        log(`Received update ${updateCount}: ${JSON.stringify(data)}`);
      },
    );

    await twoLayerCache.set('testId', 'testStore', initialData, new Date(Date.now() + 3600000));

    // Simulate server update
    jest.spyOn(twoLayerCache['serverCache'], 'get').mockResolvedValueOnce({
      identifier: 'testId',
      storeName: 'testStore',
      value: updatedData,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await twoLayerCache.get('testId', 'testStore');

    unsubscribe();

    expect(updateCount).toBe(2);
  });

  it('should handle synchronization with expired data', async () => {
    log('\nTesting synchronization with expired data...');
    const testData: DataValue = { test: 'expiringData' };
    const shortExpirationDate = new Date(Date.now() + 100); // Expire after 100ms

    await twoLayerCache.set('expiringId', 'testStore', testData, shortExpirationDate);

    // Wait for data to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    const result: CacheResult = await twoLayerCache.get('expiringId', 'testStore');
    log(`Retrieved expired data: ${JSON.stringify(result, null, 2)}`);
    expect(result.value).toBeUndefined();

    // Verify server cache was queried
    expect(twoLayerCache['serverCache'].get).toHaveBeenCalledWith('expiringId', 'testStore');
  });

  it('should synchronize cache metadata (hit counts, dates) between client and server', async () => {
    log('\nTesting synchronization of cache metadata...');
    const testData: DataValue = { test: 'metadataTestData' };

    await twoLayerCache.set('metadataId', 'testStore', testData, new Date(Date.now() + 3600000));

    // Perform multiple get operations to increase hit count
    for (let i = 0; i < 5; i++) {
      await twoLayerCache.get('metadataId', 'testStore');
    }

    // Simulate server having updated metadata
    const serverMetadata: CacheResult = {
      identifier: 'metadataId',
      storeName: 'testStore',
      value: testData,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 10,
      setHitCount: 2,
    };
    jest.spyOn(twoLayerCache['serverCache'], 'get').mockResolvedValueOnce(serverMetadata);

    const result: CacheResult = await twoLayerCache.get('metadataId', 'testStore');
    log(`Retrieved data with synced metadata: ${JSON.stringify(result, null, 2)}`);
    expect(result.getHitCount).toBe(serverMetadata.getHitCount);
    expect(result.setHitCount).toBe(serverMetadata.setHitCount);
    expect(result.lastUpdatedDate).toEqual(serverMetadata.lastUpdatedDate);
    expect(result.lastAccessedDate).toEqual(serverMetadata.lastAccessedDate);
  });
});
