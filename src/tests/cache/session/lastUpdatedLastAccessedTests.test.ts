import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';
import SessionStorageCache from '../../../cache/session.client';
import { DataValue } from '../../../types';

const logStream = createLogStream('lastUpdatedLastAccessedTests.log');
const log = createLogger(logStream);

describe('SessionStorageCache lastUpdated and lastAccessed tests', () => {
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

  it('should update lastUpdated on set operation', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    const beforeSet = new Date().getTime();
    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });
    const afterSet = new Date().getTime();

    return new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(beforeSet);
        expect(result?.lastUpdatedDate.getTime()).toBeLessThanOrEqual(afterSet);
        log('lastUpdated on set operation test passed');
        resolve();
      });
    });
  });

  it('should update lastAccessed on get operation', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    const beforeGet = new Date().getTime();
    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, () => {
        resolve();
      });
    });
    const afterGet = new Date().getTime();

    return new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(beforeGet);
        expect(result?.lastAccessedDate.getTime()).toBeLessThanOrEqual(afterGet);
        log('lastAccessed on get operation test passed');
        resolve();
      });
    });
  });

  it('should not update lastUpdated on get operation', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    let setLastUpdated: number;
    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      sessionStorageCache.get(identifier, storeName, (result) => {
        setLastUpdated = result?.lastUpdatedDate.getTime() || 0;
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        sessionStorageCache.get(identifier, storeName, () => {
          resolve();
        });
      }, 100);
    });

    return new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.lastUpdatedDate.getTime()).toBe(setLastUpdated);
        log('lastUpdated not changed on get operation test passed');
        resolve();
      });
    });
  });

  it('should update both lastUpdated and lastAccessed on set operation', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    const beforeSet = new Date().getTime();
    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });
    const afterSet = new Date().getTime();

    return new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(beforeSet);
        expect(result?.lastUpdatedDate.getTime()).toBeLessThanOrEqual(afterSet);
        expect(result?.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(beforeSet);
        expect(result?.lastAccessedDate.getTime()).toBeLessThanOrEqual(afterSet);
        log('lastUpdated and lastAccessed on set operation test passed');
        resolve();
      });
    });
  });
});
