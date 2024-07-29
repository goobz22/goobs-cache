import { realTimeSync } from '../../../utils/realTimeServerToClient';
import { DataValue } from '../../../types';
import {
  createLogStream,
  createLogger,
  setMockedGlobals,
  setupErrorHandling,
} from '../../jest/default/logging';

const logStream = createLogStream('hook-tests.log');
const log = createLogger(logStream);

// Mock implementation of useRealTimeSync
const mockUseRealTimeSync = (
  identifier: string,
  storeName: string,
  callback: (data: DataValue) => void,
): (() => void) => {
  const unsubscribe = realTimeSync.subscribe(identifier, storeName, callback);
  return unsubscribe;
};

describe('RealTimeServerToClientSync Hook Tests', () => {
  beforeAll(() => {
    setMockedGlobals();
    log('Starting Hook tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should provide a useRealTimeSync hook', () => {
    log('\nTesting useRealTimeSync hook...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'hook data' };

    const callback = jest.fn();
    const unsubscribe = mockUseRealTimeSync(identifier, storeName, callback);

    realTimeSync.notify(identifier, storeName, testData);

    log(`Callback called with: ${JSON.stringify(callback.mock.calls[0][0])}`);
    expect(callback).toHaveBeenCalledWith(testData);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toEqual(testData);

    unsubscribe();
  });

  it('should unsubscribe when the hook is no longer used', () => {
    log('\nTesting hook unsubscription...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'hook data' };

    const callback = jest.fn();
    const unsubscribe = mockUseRealTimeSync(identifier, storeName, callback);

    realTimeSync.notify(identifier, storeName, testData);
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();

    realTimeSync.notify(identifier, storeName, { test: 'updated data' });
    expect(callback).toHaveBeenCalledTimes(1);

    log('Hook unsubscribed successfully');
  });

  it('should handle multiple hooks for the same identifier and store', () => {
    log('\nTesting multiple hooks for the same key...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'hook data' };

    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const unsubscribe1 = mockUseRealTimeSync(identifier, storeName, callback1);
    const unsubscribe2 = mockUseRealTimeSync(identifier, storeName, callback2);

    realTimeSync.notify(identifier, storeName, testData);

    expect(callback1).toHaveBeenCalledWith(testData);
    expect(callback2).toHaveBeenCalledWith(testData);

    log(`Callback 1 call count: ${callback1.mock.calls.length}`);
    log(`Callback 2 call count: ${callback2.mock.calls.length}`);

    unsubscribe1();
    unsubscribe2();
  });

  it('should not trigger hook for different identifier or store', () => {
    log('\nTesting hook isolation...');
    const identifier1 = 'testId1';
    const identifier2 = 'testId2';
    const storeName1 = 'testStore1';
    const storeName2 = 'testStore2';
    const testData: DataValue = { test: 'hook data' };

    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const unsubscribe1 = mockUseRealTimeSync(identifier1, storeName1, callback1);
    const unsubscribe2 = mockUseRealTimeSync(identifier2, storeName2, callback2);

    realTimeSync.notify(identifier1, storeName1, testData);

    expect(callback1).toHaveBeenCalledWith(testData);
    expect(callback2).not.toHaveBeenCalled();

    log(`Callback 1 call count: ${callback1.mock.calls.length}`);
    log(`Callback 2 call count: ${callback2.mock.calls.length}`);

    unsubscribe1();
    unsubscribe2();
  });

  it('should handle multiple subscribe/unsubscribe cycles', () => {
    log('\nTesting multiple subscribe/unsubscribe cycles...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const testData: DataValue = { test: 'hook data' };

    const callback = jest.fn();

    const subscribeUnsubscribeCycle = () => {
      const unsubscribe = mockUseRealTimeSync(identifier, storeName, callback);
      unsubscribe();
    };

    // Simulate multiple cycles
    for (let i = 0; i < 100; i++) {
      subscribeUnsubscribeCycle();
    }

    realTimeSync.notify(identifier, storeName, testData);

    expect(callback).not.toHaveBeenCalled();

    log('Multiple subscribe/unsubscribe cycles handled successfully');
  });
});
