import { realTimeSync } from '../../../utils/realTimeServerToClient';
import { DataValue } from '../../../types';
import {
  createLogStream,
  createLogger,
  setMockedGlobals,
  setupErrorHandling,
} from '../../jest/default/logging';

const logStream = createLogStream('multiple-subscriptions-tests.log');
const log = createLogger(logStream);

describe('RealTimeServerToClientSync Multiple Subscriptions Tests', () => {
  beforeAll(() => {
    setMockedGlobals();
    log('Starting Multiple Subscriptions tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle multiple subscriptions and notifications', () => {
    log('\nTesting multiple subscriptions and notifications...');
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

  it('should not notify listeners for different identifiers or store names', () => {
    log('\nTesting notification isolation...');
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const testData: DataValue = { test: 'data' };

    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const unsubscribe1 = realTimeSync.subscribe(identifier1, storeName1, listener1);
    const unsubscribe2 = realTimeSync.subscribe(identifier2, storeName2, listener2);

    realTimeSync.notify(identifier1, storeName1, testData);

    expect(listener1).toHaveBeenCalledWith(testData);
    expect(listener2).not.toHaveBeenCalled();

    log(`Listener 1 call count: ${listener1.mock.calls.length}`);
    log(`Listener 2 call count: ${listener2.mock.calls.length}`);

    unsubscribe1();
    unsubscribe2();
  });

  it('should allow multiple subscriptions for the same identifier and store name', () => {
    log('\nTesting multiple subscriptions for the same key...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'data' };

    const listener1 = jest.fn();
    const listener2 = jest.fn();

    const unsubscribe1 = realTimeSync.subscribe(identifier, storeName, listener1);
    const unsubscribe2 = realTimeSync.subscribe(identifier, storeName, listener2);

    realTimeSync.notify(identifier, storeName, testData);

    expect(listener1).toHaveBeenCalledWith(testData);
    expect(listener2).toHaveBeenCalledWith(testData);

    log(`Listener 1 call count: ${listener1.mock.calls.length}`);
    log(`Listener 2 call count: ${listener2.mock.calls.length}`);

    unsubscribe1();
    unsubscribe2();
  });

  it('should handle unsubscription correctly with multiple subscriptions', () => {
    log('\nTesting unsubscription with multiple subscriptions...');
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

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledTimes(1);

    unsubscribe2();

    realTimeSync.notify(identifier, storeName, testData);

    expect(listener1).toHaveBeenCalledTimes(2);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledTimes(2);

    log(`Listener 1 call count: ${listener1.mock.calls.length}`);
    log(`Listener 2 call count: ${listener2.mock.calls.length}`);
    log(`Listener 3 call count: ${listener3.mock.calls.length}`);

    unsubscribe1();
    unsubscribe3();
  });

  it('should handle rapid subscribe/unsubscribe cycles with multiple subscriptions', () => {
    log('\nTesting rapid subscribe/unsubscribe cycles with multiple subscriptions...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'data' };

    const listener = jest.fn();

    for (let i = 0; i < 100; i++) {
      const unsubscribe1 = realTimeSync.subscribe(identifier, storeName, listener);
      const unsubscribe2 = realTimeSync.subscribe(identifier, storeName, listener);
      unsubscribe1();
      unsubscribe2();
    }

    realTimeSync.notify(identifier, storeName, testData);

    expect(listener).not.toHaveBeenCalled();

    log('Rapid subscribe/unsubscribe cycles with multiple subscriptions handled successfully');
  });
});
