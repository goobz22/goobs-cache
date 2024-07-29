import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';
import SessionStorageCache from '../../../cache/session.client';
import { DataValue } from '../../../types';

const logStream = createLogStream('persistenceTests.log');
const log = createLogger(logStream);

describe('SessionStorageCache persistence tests', () => {
  let sessionStorageCache: SessionStorageCache;

  beforeEach(() => {
    setMockedGlobals();
    sessionStorageCache = new SessionStorageCache(mockCacheConfig);
    setupErrorHandling(log, logStream);
  });

  afterEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it('should persist data to sessionStorage', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    const persistedData = sessionStorage.getItem('reusableStore');
    expect(persistedData).not.toBeNull();
    expect(JSON.parse(persistedData as string)).toHaveProperty([identifier, storeName]);

    log('Data persistence test passed');
  });

  it('should load persisted data on initialization', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    const mockPersistedData = {
      [identifier]: {
        [storeName]: [
          {
            identifier,
            storeName,
            value: testData,
            expirationDate: new Date(Date.now() + 3600000).toISOString(),
            lastUpdatedDate: new Date().toISOString(),
            lastAccessedDate: new Date().toISOString(),
            getHitCount: 0,
            setHitCount: 1,
          },
        ],
      },
    };

    sessionStorage.setItem('reusableStore', JSON.stringify(mockPersistedData));

    const newCache = new SessionStorageCache(mockCacheConfig);

    await new Promise<void>((resolve) => {
      newCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Persisted data loading test passed');
  });

  it('should handle corrupt persisted data gracefully', () => {
    sessionStorage.setItem('reusableStore', 'invalid JSON');

    expect(() => {
      new SessionStorageCache(mockCacheConfig);
    }).not.toThrow();

    log('Corrupt persisted data handling test passed');
  });

  it('should update persisted data when modifying cache', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const initialData: DataValue = { type: 'string', value: 'initial value' };
    const updatedData: DataValue = { type: 'string', value: 'updated value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, initialData, new Date(Date.now() + 3600000));
      resolve();
    });

    let persistedData = JSON.parse(sessionStorage.getItem('reusableStore') as string);
    expect(persistedData[identifier][storeName][0].value).toEqual(initialData);

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, updatedData, new Date(Date.now() + 3600000));
      resolve();
    });

    persistedData = JSON.parse(sessionStorage.getItem('reusableStore') as string);
    expect(persistedData[identifier][storeName][0].value).toEqual(updatedData);

    log('Persisted data update test passed');
  });

  it('should remove persisted data when clearing cache', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    expect(sessionStorage.getItem('reusableStore')).not.toBeNull();

    sessionStorageCache.clear();

    expect(sessionStorage.getItem('reusableStore')).toBeNull();

    log('Persisted data removal test passed');
  });
});
