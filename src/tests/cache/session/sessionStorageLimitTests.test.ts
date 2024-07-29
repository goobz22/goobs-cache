import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';
import SessionStorageCache from '../../../cache/session.client';
import { DataValue } from '../../../types';

const logStream = createLogStream('sessionStorageLimitTests.log');
const log = createLogger(logStream);

describe('SessionStorageCache storage limit tests', () => {
  let sessionStorageCache: SessionStorageCache;
  const originalSessionStorage = window.sessionStorage;

  beforeEach(() => {
    setMockedGlobals();
    sessionStorageCache = new SessionStorageCache(mockCacheConfig);
    setupErrorHandling(log, logStream);

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        setItem: jest.fn((key: string, value: string) => {
          if (value.length > 5000000) {
            throw new Error('Quota exceeded');
          }
        }),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'sessionStorage', { value: originalSessionStorage });
  });

  it('should handle setting large amounts of data', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const largeData: DataValue = { type: 'string', value: 'x'.repeat(4000000) };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, largeData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(largeData);
        resolve();
      });
    });

    log('Large data storage test passed');
  });

  it('should handle storage quota exceeded error', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const excessiveData: DataValue = { type: 'string', value: 'x'.repeat(6000000) };

    console.error = jest.fn();

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, excessiveData, new Date(Date.now() + 3600000));
      resolve();
    });

    expect(console.error).toHaveBeenCalledWith('Failed to set session cache', expect.any(Error));

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeUndefined();
        resolve();
      });
    });

    log('Storage quota exceeded error handling test passed');
  });

  it('should handle multiple sets approaching the limit', async () => {
    const storeName = 'test-store';
    const data: DataValue = { type: 'string', value: 'x'.repeat(2000000) };

    for (let i = 0; i < 3; i++) {
      const identifier = `test-identifier-${i}`;
      await new Promise<void>((resolve) => {
        sessionStorageCache.set(identifier, storeName, data, new Date(Date.now() + 3600000));
        resolve();
      });
    }

    for (let i = 0; i < 3; i++) {
      const identifier = `test-identifier-${i}`;
      await new Promise<void>((resolve) => {
        sessionStorageCache.get(identifier, storeName, (result) => {
          expect(result).toBeDefined();
          expect(result?.value).toEqual(data);
          resolve();
        });
      });
    }

    log('Multiple sets approaching limit test passed');
  });

  it('should handle removal of data to free up space', async () => {
    const storeName = 'test-store';
    const largeData: DataValue = { type: 'string', value: 'x'.repeat(4000000) };
    const smallData: DataValue = { type: 'string', value: 'small data' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set('large-data', storeName, largeData, new Date(Date.now() + 3600000));
      resolve();
    });

    sessionStorageCache.remove('large-data', storeName);

    await new Promise<void>((resolve) => {
      sessionStorageCache.set('small-data', storeName, smallData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get('small-data', storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(smallData);
        resolve();
      });
    });

    log('Data removal to free up space test passed');
  });
});
