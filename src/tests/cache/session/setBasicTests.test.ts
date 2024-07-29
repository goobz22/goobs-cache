import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';
import SessionStorageCache from '../../../cache/session.client';
import { DataValue } from '../../../types';

const logStream = createLogStream('setBasicTests.log');
const log = createLogger(logStream);

describe('SessionStorageCache set basic tests', () => {
  let sessionStorageCache: SessionStorageCache;

  beforeEach(() => {
    setMockedGlobals();
    sessionStorageCache = new SessionStorageCache(mockCacheConfig);
    setupErrorHandling(log, logStream);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set a simple string value', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Set simple string value test passed');
  });

  it('should set a number value', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'number', value: 12345 };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Set number value test passed');
  });

  it('should set a boolean value', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'boolean', value: true };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Set boolean value test passed');
  });

  it('should set a complex object value', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = {
      type: 'json',
      value: {
        name: 'John Doe',
        age: 30,
        isStudent: false,
        grades: [85, 90, 95],
        address: {
          street: '123 Main St',
          city: 'Anytown',
          country: 'USA',
        },
      },
    };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    log('Set complex object value test passed');
  });

  it('should overwrite existing value for the same identifier and storeName', async () => {
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const initialData: DataValue = { type: 'string', value: 'initial value' };
    const updatedData: DataValue = { type: 'string', value: 'updated value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, initialData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, updatedData, new Date(Date.now() + 3600000));
      resolve();
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(updatedData);
        resolve();
      });
    });

    log('Overwrite existing value test passed');
  });
});
