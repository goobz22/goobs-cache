import { realTimeSync, useRealTimeSync } from '../../../utils/realTimeServerToClient';
import { DataValue, CacheResult } from '../../../types';
import {
  createLogStream,
  createLogger,
  setMockedGlobals,
  setupErrorHandling,
} from '../../jest/default/logging';

const logStream = createLogStream('error-handling-tests.log');
const log = createLogger(logStream);

describe('RealTimeServerToClientSync Error Handling Tests', () => {
  beforeAll(() => {
    setMockedGlobals();
    log('Starting Error Handling tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle subscription error gracefully', () => {
    log('\nTesting subscription error handling...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testError = new Error('Subscription error');

    const originalSubscribe = realTimeSync.subscribe;
    realTimeSync.subscribe = jest.fn(() => {
      throw testError;
    });

    const callback = jest.fn();

    expect(() => {
      useRealTimeSync(identifier, storeName, callback);
    }).toThrow(testError);

    log('Subscription error handled gracefully');

    realTimeSync.subscribe = originalSubscribe;
  });

  it('should handle notification error gracefully', () => {
    log('\nTesting notification error handling...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'error data' };
    const testError = new Error('Notification error');

    const listener = jest.fn(() => {
      throw testError;
    });

    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);

    expect(() => {
      realTimeSync.notify(identifier, storeName, testData);
    }).toThrow(testError);

    log('Notification error handled gracefully');

    unsubscribe();
  });

  it('should handle cache update error gracefully', () => {
    log('\nTesting cache update error handling...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'error data' };
    const testError = new Error('Cache update error');

    const listener = jest.fn(() => {
      throw testError;
    });

    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);

    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: testData,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    expect(() => {
      realTimeSync.handleCacheUpdate(cacheResult);
    }).toThrow(testError);

    log('Cache update error handled gracefully');

    unsubscribe();
  });

  it('should handle unsubscribe error gracefully', () => {
    log('\nTesting unsubscribe error handling...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testError = new Error('Unsubscribe error');

    // Mock the unsubscribe function to throw an error
    const originalSubscribe = realTimeSync.subscribe;
    const mockUnsubscribe = jest.fn(() => {
      throw testError;
    });
    realTimeSync.subscribe = jest.fn(() => mockUnsubscribe);

    const callback = jest.fn();
    const unsubscribe = useRealTimeSync(identifier, storeName, callback);

    expect(() => {
      unsubscribe();
    }).toThrow(testError);

    log('Unsubscribe error handled gracefully');

    // Restore the original subscribe function
    realTimeSync.subscribe = originalSubscribe;
  });
});
