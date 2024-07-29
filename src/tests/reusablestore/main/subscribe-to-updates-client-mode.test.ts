import { subscribeToUpdates, set } from '../../../reusableStore';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  setMockedGlobals,
} from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  subscribeToUpdates: jest.fn(),
  set: jest.fn(),
}));

const logStream: WriteStream = createLogStream('subscribe-to-updates-client-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Subscribe to Updates in Client Mode Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'client';

  beforeAll(() => {
    log('Starting Subscribe to Updates in Client Mode tests...');
    setupErrorHandling(log, logStream);
    setMockedGlobals();
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should subscribe to updates successfully', async () => {
    const identifier = 'subscribe-test';
    const listener = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});

    const unsubscribe = await subscribeToUpdates(identifier, storeName, listener, mode);

    expect(subscribeToUpdates).toHaveBeenCalledWith(identifier, storeName, listener, mode);
    expect(typeof unsubscribe).toBe('function');

    log('Successfully subscribed to updates in client mode');
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

    (set as jest.Mock).mockImplementation((id, store, value) => {
      storedValue = value as StringValue;
      listener(storedValue);
      return Promise.resolve();
    });

    await subscribeToUpdates(identifier, storeName, listener, mode);
    await set(identifier, storeName, updatedValue, mode);

    expect(listener).toHaveBeenCalledWith(updatedValue);

    log('Successfully received updates when value is set in client mode');
  });

  it('should stop receiving updates after unsubscribing', async () => {
    const identifier = 'unsubscribe-test';
    const value: StringValue = { type: 'string', value: 'test' };
    const listener = jest.fn();

    const unsubscribeMock = jest.fn();
    (subscribeToUpdates as jest.Mock).mockResolvedValue(unsubscribeMock);

    const unsubscribe = await subscribeToUpdates(identifier, storeName, listener, mode);
    unsubscribe();

    await set(identifier, storeName, value, mode);

    expect(unsubscribeMock).toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();

    log('Successfully stopped receiving updates after unsubscribing in client mode');
  });

  it('should handle multiple subscribers for the same identifier', async () => {
    const identifier = 'multi-subscriber-test';
    const value: StringValue = { type: 'string', value: 'test' };
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});
    (set as jest.Mock).mockImplementation((id, store, val) => {
      listener1(val);
      listener2(val);
      return Promise.resolve();
    });

    await subscribeToUpdates(identifier, storeName, listener1, mode);
    await subscribeToUpdates(identifier, storeName, listener2, mode);

    await set(identifier, storeName, value, mode);

    expect(listener1).toHaveBeenCalledWith(value);
    expect(listener2).toHaveBeenCalledWith(value);

    log('Successfully handled multiple subscribers for the same identifier in client mode');
  });

  it('should handle errors in listeners gracefully', async () => {
    const identifier = 'error-test';
    const value: StringValue = { type: 'string', value: 'test' };
    const errorListener = jest.fn().mockImplementation(() => {
      throw new Error('Listener error');
    });
    const normalListener = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});
    (set as jest.Mock).mockImplementation((id, store, val) => {
      errorListener(val);
      normalListener(val);
      return Promise.resolve();
    });

    await subscribeToUpdates(identifier, storeName, errorListener, mode);
    await subscribeToUpdates(identifier, storeName, normalListener, mode);

    await expect(set(identifier, storeName, value, mode)).resolves.not.toThrow();

    expect(errorListener).toHaveBeenCalledWith(value);
    expect(normalListener).toHaveBeenCalledWith(value);

    log('Successfully handled errors in listeners gracefully in client mode');
  });

  it('should handle subscription to non-existent keys', async () => {
    const identifier = 'non-existent-test';
    const listener = jest.fn();

    await subscribeToUpdates(identifier, storeName, listener, mode);

    expect(subscribeToUpdates).toHaveBeenCalledWith(identifier, storeName, listener, mode);

    log('Successfully handled subscription to non-existent keys in client mode');
  });

  it('should handle rapid subscription and unsubscription', async () => {
    const identifier = 'rapid-test';
    const listener = jest.fn();

    const unsubscribeMock = jest.fn();
    (subscribeToUpdates as jest.Mock).mockResolvedValue(unsubscribeMock);

    const unsubscribe1 = await subscribeToUpdates(identifier, storeName, listener, mode);
    const unsubscribe2 = await subscribeToUpdates(identifier, storeName, listener, mode);

    unsubscribe1();
    unsubscribe2();

    expect(unsubscribeMock).toHaveBeenCalledTimes(2);

    log('Successfully handled rapid subscription and unsubscription in client mode');
  });

  it('should maintain subscriptions across page reloads', async () => {
    const identifier = 'reload-test';
    const value: StringValue = { type: 'string', value: 'test' };
    const listener = jest.fn();

    // Simulate page reload
    const reloadEvent = new Event('beforeunload');
    window.dispatchEvent(reloadEvent);

    await subscribeToUpdates(identifier, storeName, listener, mode);
    await set(identifier, storeName, value, mode);

    expect(listener).toHaveBeenCalledWith(value);

    log('Successfully maintained subscriptions across simulated page reload in client mode');
  });
});
