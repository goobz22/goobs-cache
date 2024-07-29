import fs from 'fs';
import { ServerStorage } from '../../../../utils/twoLayerCache.client';
import { StringValue } from '../../../../types';
import { createLogStream, createLogger } from '../../../jest/default/logging';

describe('ServerStorage - subscribeToUpdates', () => {
  let serverStorage: ServerStorage;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    logStream = createLogStream('server-storage-subscribe-to-updates-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should subscribe to updates', () => {
    const listener = jest.fn();
    const unsubscribe = serverStorage.subscribeToUpdates('testId', 'testStore', listener);

    expect(serverStorage.subscribeToUpdates).toHaveBeenCalledWith('testId', 'testStore', listener);
    expect(typeof unsubscribe).toBe('function');
    log('Subscribed to updates');
  });

  it('should receive updates when data changes', () => {
    const listener = jest.fn();
    serverStorage.subscribeToUpdates('testId', 'testStore', listener);

    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const mockUpdate = serverStorage.subscribeToUpdates as jest.Mock;
    mockUpdate.mock.calls[0][2](updatedData);

    expect(listener).toHaveBeenCalledWith(updatedData);
    log('Received update when data changed');
  });

  it('should unsubscribe from updates', () => {
    const listener = jest.fn();
    const unsubscribe = serverStorage.subscribeToUpdates('testId', 'testStore', listener);

    unsubscribe();

    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const mockUpdate = serverStorage.subscribeToUpdates as jest.Mock;
    mockUpdate.mock.calls[0][2](updatedData);

    expect(listener).not.toHaveBeenCalled();
    log('Unsubscribed from updates');
  });

  it('should handle multiple subscribers', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    serverStorage.subscribeToUpdates('testId', 'testStore', listener1);
    serverStorage.subscribeToUpdates('testId', 'testStore', listener2);

    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const mockUpdate = serverStorage.subscribeToUpdates as jest.Mock;
    mockUpdate.mock.calls[0][2](updatedData);
    mockUpdate.mock.calls[1][2](updatedData);

    expect(listener1).toHaveBeenCalledWith(updatedData);
    expect(listener2).toHaveBeenCalledWith(updatedData);
    log('Handled multiple subscribers');
  });

  it('should handle subscription to different stores', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    serverStorage.subscribeToUpdates('testId', 'store1', listener1);
    serverStorage.subscribeToUpdates('testId', 'store2', listener2);

    const updatedData1: StringValue = { type: 'string', value: 'updatedValue1' };
    const updatedData2: StringValue = { type: 'string', value: 'updatedValue2' };
    const mockUpdate = serverStorage.subscribeToUpdates as jest.Mock;
    mockUpdate.mock.calls[0][2](updatedData1);
    mockUpdate.mock.calls[1][2](updatedData2);

    expect(listener1).toHaveBeenCalledWith(updatedData1);
    expect(listener2).toHaveBeenCalledWith(updatedData2);
    log('Handled subscription to different stores');
  });
});
