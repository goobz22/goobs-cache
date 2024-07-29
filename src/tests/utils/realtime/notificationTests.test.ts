import { realTimeSync } from '../../../utils/realTimeServerToClient';
import { DataValue } from '../../../types';
import {
  createLogStream,
  createLogger,
  setMockedGlobals,
  setupErrorHandling,
} from '../../jest/default/logging';

const logStream = createLogStream('notification-tests.log');
const log = createLogger(logStream);

describe('RealTimeServerToClientSync Notification Tests', () => {
  beforeAll(() => {
    setMockedGlobals();
    log('Starting Notification tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should notify subscribed listeners', () => {
    log('\nTesting basic notification...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'data' };

    const listener = jest.fn();
    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);

    realTimeSync.notify(identifier, storeName, testData);

    log(`Listener called with: ${JSON.stringify(listener.mock.calls[0][0])}`);
    expect(listener).toHaveBeenCalledWith(testData);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('should not notify unsubscribed listeners', () => {
    log('\nTesting notification after unsubscribe...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'data' };

    const listener = jest.fn();
    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);

    unsubscribe();

    realTimeSync.notify(identifier, storeName, testData);

    log(`Listener call count: ${listener.mock.calls.length}`);
    expect(listener).not.toHaveBeenCalled();
  });

  it('should notify multiple listeners for the same identifier and store', () => {
    log('\nTesting notification for multiple listeners...');
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

    log(`Listener 1 call count: ${listener1.mock.calls.length}`);
    log(`Listener 2 call count: ${listener2.mock.calls.length}`);

    expect(listener1).toHaveBeenCalledWith(testData);
    expect(listener2).not.toHaveBeenCalled();

    unsubscribe1();
    unsubscribe2();
  });

  it('should handle notifications with different data types', () => {
    log('\nTesting notifications with different data types...');
    const identifier = 'testId';
    const storeName = 'testStore';

    const listener = jest.fn();
    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);

    const testCases = [
      { test: 'string data' },
      { test: 123 },
      { test: true },
      { test: [1, 2, 3] },
      { test: { nested: 'object' } },
      { test: null },
    ];

    testCases.forEach((testData, index) => {
      realTimeSync.notify(identifier, storeName, testData);
      log(`Listener called with (case ${index}): ${JSON.stringify(listener.mock.calls[index][0])}`);
      expect(listener).toHaveBeenNthCalledWith(index + 1, testData);
    });

    expect(listener).toHaveBeenCalledTimes(testCases.length);

    unsubscribe();
  });

  it('should handle rapid notifications', () => {
    log('\nTesting rapid notifications...');
    const identifier = 'testId';
    const storeName = 'testStore';

    const listener = jest.fn();
    const unsubscribe = realTimeSync.subscribe(identifier, storeName, listener);

    const notificationCount = 1000;
    for (let i = 0; i < notificationCount; i++) {
      realTimeSync.notify(identifier, storeName, { test: `data${i}` });
    }

    log(`Listener call count: ${listener.mock.calls.length}`);
    expect(listener).toHaveBeenCalledTimes(notificationCount);

    unsubscribe();
  });
});
