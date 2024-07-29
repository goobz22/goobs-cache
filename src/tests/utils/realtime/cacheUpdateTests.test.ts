import { realTimeSync } from '../../../utils/realTimeServerToClient';
import { DataValue, CacheResult } from '../../../types';
import {
  createLogStream,
  createLogger,
  setMockedGlobals,
  setupErrorHandling,
} from '../../jest/default/logging';

const logStream = createLogStream('cache-update-tests.log');
const log = createLogger(logStream);

describe('RealTimeServerToClientSync Cache Update Tests', () => {
  beforeAll(() => {
    setMockedGlobals();
    log('Starting Cache Update tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle cache updates', () => {
    log('\nTesting handleCacheUpdate...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'cache update' };

    const listener = jest.fn();
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

    realTimeSync.handleCacheUpdate(cacheResult);

    log(`Listener called with: ${JSON.stringify(listener.mock.calls[0][0])}`);
    expect(listener).toHaveBeenCalledWith(testData);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toEqual(testData);

    unsubscribe();
  });

  it('should not notify for undefined cache values', () => {
    log('\nTesting handleCacheUpdate with undefined value...');
    const identifier = 'testId';
    const storeName = 'testStore';

    const listener = jest.fn();
    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);

    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    realTimeSync.handleCacheUpdate(cacheResult);

    log(`Listener call count: ${listener.mock.calls.length}`);
    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('should handle concurrent cache updates', () => {
    log('\nTesting concurrent cache updates...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData1: DataValue = { test: 'data1' };
    const testData2: DataValue = { test: 'data2' };

    const listener = jest.fn();
    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);

    const cacheResult1: CacheResult = {
      identifier,
      storeName,
      value: testData1,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    const cacheResult2: CacheResult = {
      identifier,
      storeName,
      value: testData2,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 2,
      setHitCount: 2,
    };

    realTimeSync.handleCacheUpdate(cacheResult1);
    realTimeSync.handleCacheUpdate(cacheResult2);

    log(`Listener first call with: ${JSON.stringify(listener.mock.calls[0][0])}`);
    log(`Listener second call with: ${JSON.stringify(listener.mock.calls[1][0])}`);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0][0]).toEqual(testData1);
    expect(listener.mock.calls[1][0]).toEqual(testData2);

    unsubscribe();
  });
});
