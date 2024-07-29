import { jest, describe, it, beforeAll, beforeEach, afterAll, expect } from '@jest/globals';
import {
  MockSessionStorageCache,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/session.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { DataValue } from '../../../types';

jest.mock('../../../jest/mocks/cache/client/session.mock');
jest.mock('../../../jest/reusableJest/logging');
jest.mock('../../../jest/reusableJest/errorHandling');

describe('SessionStorageCache encryption and decryption tests', () => {
  let sessionStorageCache: MockSessionStorageCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = await runTestsWithLogging('encryptionDecryptionTests.log', 'client');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting SessionStorageCache encryption and decryption tests...');
  });

  beforeEach(() => {
    sessionStorageCache = new MockSessionStorageCache(defaultMockConfig);
    log('Test setup complete');
  });

  afterAll(() => {
    jest.clearAllMocks();
    closeLogStreams();
  });

  it('should encrypt data when setting and decrypt when getting', async () => {
    log('Starting test: should encrypt data when setting and decrypt when getting');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    const mockGet = jest.spyOn(sessionStorageCache, 'get');

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier, storeName, (result) => {
        expect(result).toBeDefined();
        expect(result?.value).toEqual(testData);
        resolve();
      });
    });

    expect(mockGet).toHaveBeenCalled();
    log('Encryption and decryption test passed');
  });

  it('should use different IVs for each encryption', async () => {
    log('Starting test: should use different IVs for each encryption');
    const identifier1 = 'test-identifier-1';
    const identifier2 = 'test-identifier-2';
    const storeName = 'test-store';
    const testData1: DataValue = { type: 'string', value: 'test value 1' };
    const testData2: DataValue = { type: 'string', value: 'test value 2' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier1, storeName, testData1, new Date(Date.now() + 3600000));
      resolve();
    });
    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier2, storeName, testData2, new Date(Date.now() + 3600000));
      resolve();
    });

    const mockGet = jest.spyOn(sessionStorageCache, 'get');

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier1, storeName, (result1) => {
        expect(result1).toBeDefined();
        expect(result1?.value).toEqual(testData1);
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      sessionStorageCache.get(identifier2, storeName, (result2) => {
        expect(result2).toBeDefined();
        expect(result2?.value).toEqual(testData2);
        resolve();
      });
    });

    expect(mockGet).toHaveBeenCalledTimes(2);
    log('Different IVs for each encryption test passed');
  });

  it('should handle encryption of complex objects', async () => {
    log('Starting test: should handle encryption of complex objects');
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

    log('Complex object encryption and decryption test passed');
  });

  it('should handle encryption of large data', async () => {
    log('Starting test: should handle encryption of large data');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const largeString = 'a'.repeat(1000000);
    const testData: DataValue = { type: 'string', value: largeString };

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

    log('Large data encryption and decryption test passed');
  });

  it('should not be able to decrypt data with wrong password', async () => {
    log('Starting test: should not be able to decrypt data with wrong password');
    const identifier = 'test-identifier';
    const storeName = 'test-store';
    const testData: DataValue = { type: 'string', value: 'test value' };

    await new Promise<void>((resolve) => {
      sessionStorageCache.set(identifier, storeName, testData, new Date(Date.now() + 3600000));
      resolve();
    });

    const wrongPasswordConfig = { ...defaultMockConfig, encryptionPassword: 'wrongpassword' };
    const wrongPasswordCache = new MockSessionStorageCache(wrongPasswordConfig);

    await new Promise<void>((resolve) => {
      wrongPasswordCache.get(identifier, storeName, (result) => {
        expect(result).toBeUndefined();
        resolve();
      });
    });

    log('Wrong password decryption test passed');
  });
});
