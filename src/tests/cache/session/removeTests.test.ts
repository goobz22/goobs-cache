import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';
import SessionStorageCache from '../../../cache/session.client';
import { DataValue } from '../../../types';

const logStream = createLogStream('removeTests.log');
const log = createLogger(logStream);

describe('SessionStorageCache remove tests', () => {
  let sessionStorageCache: SessionStorageCache;

  beforeEach(() => {
    setMockedGlobals();
    sessionStorageCache = new SessionStorageCache(mockCacheConfig);
    setupErrorHandling(log, logStream);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should remove a specific item from the cache', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    sessionStorageCache.remove(identifier, storeName);

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeUndefined();
        resolve();
      });
    });

    log('Remove specific item test passed');
  });

  it('should not affect other items when removing a specific item', async () => {
    const identifier1 = 'test-identifier-1';
    const identifier2 = 'test-identifier-2';
    const storeName = 'test-store';
    const testData1: DataValue = { type: 'string', value: 'test value 1' };
    const testData2: DataValue = { type: 'string', value: 'test value 2' };

    await Promise.all([
      new Promise<void>((resolve) => {
        sessionStorageCache.set(identifier1, storeName, testData1, new Date(Date.now() + 3600000));
        resolve();
      }),
      new Promise<void>((resolve) => {
        sessionStorageCache.set(identifier2, storeName, testData2, new Date(Date.now() + 3600000));
        resolve();
      }),
    ]);

    sessionStorageCache.remove(identifier1, storeName);

    await Promise.all([
      new Promise<void>((resolve) => {
        sessionStorageCache.get(identifier1, storeName, (result) => {
          expect(result).toBeUndefined();
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        sessionStorageCache.get(identifier2, storeName, (result) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(testData2);
          resolve();
        });
      }),
    ]);

    log('Remove specific item without affecting others test passed');
  });

  it('should handle removing a non-existent item', () => {
    const identifier = 'non-existent-identifier';
    const storeName = 'test-store';

    expect(() => {
      sessionStorageCache.remove(identifier, storeName);
    }).not.toThrow();

    log('Remove non-existent item test passed');
  });

  it('should remove all items for a specific identifier', async () => {
    const identifier = 'test-identifier';
    const storeName1 = 'test-store-1';
    const storeName2 = 'test-store-2';
    const testData1: DataValue = { type: 'string', value: 'test value 1' };
    const testData2: DataValue = { type: 'string', value: 'test value 2' };

    await Promise.all([
      new Promise<void>((resolve) => {
        sessionStorageCache.set(identifier, storeName1, testData1, new Date(Date.now() + 3600000));
        resolve();
      }),
      new Promise<void>((resolve) => {
        sessionStorageCache.set(identifier, storeName2, testData2, new Date(Date.now() + 3600000));
        resolve();
      }),
    ]);

    sessionStorageCache.remove(identifier, storeName1);
    sessionStorageCache.remove(identifier, storeName2);

    await Promise.all([
      new Promise<void>((resolve) => {
        sessionStorageCache.get(identifier, storeName1, (result) => {
          expect(result).toBeUndefined();
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        sessionStorageCache.get(identifier, storeName2, (result) => {
          expect(result).toBeUndefined();
          resolve();
        });
      }),
    ]);

    log('Remove all items for specific identifier test passed');
  });

  it('should update lastUpdatedDate when removing an item', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    const initialLastUpdated = sessionStorage.getItem(`${identifier}:${storeName}:lastUpdated`);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        sessionStorageCache.remove(identifier, storeName);
        resolve();
      }, 10);
    });

    const updatedLastUpdated = sessionStorage.getItem(`${identifier}:${storeName}:lastUpdated`);

    expect(updatedLastUpdated).not.toEqual(initialLastUpdated);
    expect(new Date(updatedLastUpdated || '')).toBeInstanceOf(Date);

    log('Update lastUpdatedDate on remove test passed');
  });
});
