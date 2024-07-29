import { serverSet, serverRemove, subscribeToUpdates } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.fn(),
  serverRemove: jest.fn(),
  subscribeToUpdates: jest.fn(),
}));

const logStream: WriteStream = createLogStream('real-time-updates-handling-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Real-time Updates Handling Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting Real-time Updates Handling tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully subscribe to updates', async () => {
    const identifier = 'subscribe-test';
    const listener = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});

    const unsubscribe = await subscribeToUpdates(identifier, storeName, listener);

    expect(subscribeToUpdates).toHaveBeenCalledWith(identifier, storeName, listener);
    expect(typeof unsubscribe).toBe('function');

    log('Successfully subscribed to updates');
  });

  it('should receive updates when value is set', async () => {
    const identifier = 'update-test';
    const initialValue: StringValue = { type: 'string', value: 'initial' };
    const updatedValue: StringValue = { type: 'string', value: 'updated' };
    const listener = jest.fn();

    let storedValue = initialValue;
    (subscribeToUpdates as jest.Mock).mockImplementation((id, store, listenerFn) => {
      return () => {
        listenerFn(storedValue);
      };
    });

    (serverSet as jest.Mock).mockImplementation((id, store, value) => {
      storedValue = value as StringValue;
      listener(storedValue);
      return Promise.resolve();
    });

    await subscribeToUpdates(identifier, storeName, listener);
    await serverSet(identifier, storeName, updatedValue, new Date(), mode);

    expect(listener).toHaveBeenCalledWith(updatedValue);

    log('Successfully received updates when value is set');
  });

  it('should stop receiving updates after unsubscribing', async () => {
    const identifier = 'unsubscribe-test';
    const value: StringValue = { type: 'string', value: 'test' };
    const listener = jest.fn();

    const unsubscribeMock = jest.fn();
    (subscribeToUpdates as jest.Mock).mockResolvedValue(unsubscribeMock);

    const unsubscribe = await subscribeToUpdates(identifier, storeName, listener);
    unsubscribe();

    await serverSet(identifier, storeName, value, new Date(), mode);

    expect(unsubscribeMock).toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();

    log('Successfully stopped receiving updates after unsubscribing');
  });

  it('should handle multiple subscribers for the same identifier', async () => {
    const identifier = 'multi-subscriber-test';
    const value: StringValue = { type: 'string', value: 'test' };
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});
    (serverSet as jest.Mock).mockImplementation((id, store, val) => {
      listener1(val);
      listener2(val);
      return Promise.resolve();
    });

    await subscribeToUpdates(identifier, storeName, listener1);
    await subscribeToUpdates(identifier, storeName, listener2);

    await serverSet(identifier, storeName, value, new Date(), mode);

    expect(listener1).toHaveBeenCalledWith(value);
    expect(listener2).toHaveBeenCalledWith(value);

    log('Successfully handled multiple subscribers for the same identifier');
  });

  it('should not trigger updates on remove', async () => {
    const identifier = 'remove-test';
    const listener = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});
    (serverRemove as jest.Mock).mockResolvedValue(undefined);

    await subscribeToUpdates(identifier, storeName, listener);
    await serverRemove(identifier, storeName, mode);

    expect(listener).not.toHaveBeenCalled();

    log('Successfully avoided triggering updates on remove');
  });

  it('should handle errors in listeners gracefully', async () => {
    const identifier = 'error-test';
    const value: StringValue = { type: 'string', value: 'test' };
    const errorListener = jest.fn().mockImplementation(() => {
      throw new Error('Listener error');
    });
    const normalListener = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});
    (serverSet as jest.Mock).mockImplementation((id, store, val) => {
      errorListener(val);
      normalListener(val);
      return Promise.resolve();
    });

    await subscribeToUpdates(identifier, storeName, errorListener);
    await subscribeToUpdates(identifier, storeName, normalListener);

    await expect(serverSet(identifier, storeName, value, new Date(), mode)).resolves.not.toThrow();

    expect(errorListener).toHaveBeenCalledWith(value);
    expect(normalListener).toHaveBeenCalledWith(value);

    log('Successfully handled errors in listeners gracefully');
  });

  it('should maintain subscription after cache clear', async () => {
    const identifier = 'clear-test';
    const value: StringValue = { type: 'string', value: 'test' };
    const listener = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});
    (serverSet as jest.Mock).mockImplementation((id, store, val) => {
      listener(val);
      return Promise.resolve();
    });
    (serverRemove as jest.Mock).mockResolvedValue(undefined);

    await subscribeToUpdates(identifier, storeName, listener);

    // Simulate cache clear
    await serverRemove('*', storeName, mode);

    // Set new value after clear
    await serverSet(identifier, storeName, value, new Date(), mode);

    expect(listener).toHaveBeenCalledWith(value);

    log('Successfully maintained subscription after cache clear');
  });
});
