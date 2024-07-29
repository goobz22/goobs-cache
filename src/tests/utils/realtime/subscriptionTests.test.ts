import { realTimeSync, useRealTimeSync } from '../../../utils/realTimeServerToClient';
import { DataValue } from '../../../types';
import {
  createLogStream,
  createLogger,
  setMockedGlobals,
  setupErrorHandling,
} from '../../jest/default/logging';

const logStream = createLogStream('subscription-tests.log');
const log = createLogger(logStream);

describe('RealTimeServerToClientSync Subscription Tests', () => {
  beforeAll(() => {
    setMockedGlobals();
    log('Starting Subscription tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should subscribe and notify listeners', () => {
    log('\nTesting subscribe and notify...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'data' };

    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const unsubscribe1 = realTimeSync.subscribe(identifier, storeName, listener1);
    const unsubscribe2 = realTimeSync.subscribe(identifier, storeName, listener2);

    realTimeSync.notify(identifier, storeName, testData);

    log(`Listener 1 called with: ${JSON.stringify(listener1.mock.calls[0][0])}`);
    log(`Listener 2 called with: ${JSON.stringify(listener2.mock.calls[0][0])}`);

    expect(listener1).toHaveBeenCalledWith(testData);
    expect(listener2).toHaveBeenCalledWith(testData);

    unsubscribe1();
    realTimeSync.notify(identifier, storeName, { test: 'updated' });

    log(`Listener 1 call count: ${listener1.mock.calls.length}`);
    log(`Listener 2 call count: ${listener2.mock.calls.length}`);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);

    unsubscribe2();
  });

  it('should handle multiple subscriptions for the same identifier and store', () => {
    log('\nTesting multiple subscriptions for the same key...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'data' };

    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();

    const unsubscribe1 = realTimeSync.subscribe(identifier, storeName, listener1);
    const unsubscribe2 = realTimeSync.subscribe(identifier, storeName, listener2);
    const unsubscribe3 = realTimeSync.subscribe(identifier, storeName, listener3);

    realTimeSync.notify(identifier, storeName, testData);

    log(`Listener 1 call count: ${listener1.mock.calls.length}`);
    log(`Listener 2 call count: ${listener2.mock.calls.length}`);
    log(`Listener 3 call count: ${listener3.mock.calls.length}`);

    expect(listener1).toHaveBeenCalledWith(testData);
    expect(listener2).toHaveBeenCalledWith(testData);
    expect(listener3).toHaveBeenCalledWith(testData);

    unsubscribe1();
    unsubscribe2();
    unsubscribe3();
  });

  it('should not notify after unsubscribe', () => {
    log('\nTesting unsubscribe...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'data' };

    const listener = jest.fn();

    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);
    realTimeSync.notify(identifier, storeName, testData);

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    realTimeSync.notify(identifier, storeName, { test: 'updated' });

    log(`Listener call count: ${listener.mock.calls.length}`);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should handle subscriptions for different identifiers and stores', () => {
    log('\nTesting subscriptions for different keys...');
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const testData1: DataValue = { test: 'data1' };
    const testData2: DataValue = { test: 'data2' };

    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const unsubscribe1 = realTimeSync.subscribe(identifier1, storeName1, listener1);
    const unsubscribe2 = realTimeSync.subscribe(identifier2, storeName2, listener2);

    realTimeSync.notify(identifier1, storeName1, testData1);
    realTimeSync.notify(identifier2, storeName2, testData2);

    log(`Listener 1 called with: ${JSON.stringify(listener1.mock.calls[0][0])}`);
    log(`Listener 2 called with: ${JSON.stringify(listener2.mock.calls[0][0])}`);

    expect(listener1).toHaveBeenCalledWith(testData1);
    expect(listener2).toHaveBeenCalledWith(testData2);

    unsubscribe1();
    unsubscribe2();
  });

  it('should handle rapid subscribe/unsubscribe cycles', () => {
    log('\nTesting rapid subscribe/unsubscribe cycles...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'data' };

    const listener = jest.fn();

    for (let i = 0; i < 1000; i++) {
      const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);
      unsubscribe();
    }

    realTimeSync.notify(identifier, storeName, testData);

    log(`Listener call count: ${listener.mock.calls.length}`);
    expect(listener).not.toHaveBeenCalled();
  });

  it('should handle cache updates', () => {
    log('\nTesting handleCacheUpdate...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'cache update' };

    const listener = jest.fn();
    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);

    realTimeSync.handleCacheUpdate({
      identifier,
      storeName,
      value: testData,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    log(`Listener called with: ${JSON.stringify(listener.mock.calls[0][0])}`);
    expect(listener).toHaveBeenCalledWith(testData);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('should work with useRealTimeSync hook', () => {
    log('\nTesting useRealTimeSync hook...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'hook data' };

    const callback = jest.fn();
    const unsubscribe = useRealTimeSync(identifier, storeName, callback);

    realTimeSync.notify(identifier, storeName, testData);

    log(`Callback called with: ${JSON.stringify(callback.mock.calls[0][0])}`);
    expect(callback).toHaveBeenCalledWith(testData);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toEqual(testData);

    unsubscribe();
  });

  it('should not notify for undefined cache values', () => {
    log('\nTesting handleCacheUpdate with undefined value...');
    const identifier = 'testId';
    const storeName = 'testStore';

    const listener = jest.fn();
    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);

    realTimeSync.handleCacheUpdate({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

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

    realTimeSync.handleCacheUpdate({
      identifier,
      storeName,
      value: testData1,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    realTimeSync.handleCacheUpdate({
      identifier,
      storeName,
      value: testData2,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 2,
      setHitCount: 2,
    });

    log(`Listener first call with: ${JSON.stringify(listener.mock.calls[0][0])}`);
    log(`Listener second call with: ${JSON.stringify(listener.mock.calls[1][0])}`);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0][0]).toEqual(testData1);
    expect(listener.mock.calls[1][0]).toEqual(testData2);

    unsubscribe();
  });

  // This test is to ensure that the RealTimeServerToClientSync class is working as expected
  // even after multiple operations
  it('should maintain consistency after multiple operations', () => {
    log('\nTesting consistency after multiple operations...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'final data' };

    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const unsubscribe1 = realTimeSync.subscribe(identifier, storeName, listener1);
    const unsubscribe2 = realTimeSync.subscribe(identifier, storeName, listener2);

    realTimeSync.notify(identifier, storeName, { test: 'initial data' });
    unsubscribe1();

    realTimeSync.handleCacheUpdate({
      identifier,
      storeName,
      value: testData,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    log(`Listener 1 call count: ${listener1.mock.calls.length}`);
    log(`Listener 2 call count: ${listener2.mock.calls.length}`);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(2);
    expect(listener2.mock.calls[1][0]).toEqual(testData);

    unsubscribe2();
  });
});
