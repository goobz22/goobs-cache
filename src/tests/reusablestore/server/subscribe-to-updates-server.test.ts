import { serverSet, subscribeToUpdates } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.fn(),
  subscribeToUpdates: jest.fn(),
}));

const logStream: WriteStream = createLogStream('subscribe-to-updates-server-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Server-side Subscribe to Updates Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting Server-side Subscribe to Updates tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully subscribe to updates', async () => {
    const identifier = 'test-subscribe';
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };
    const listener = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});

    const unsubscribe = await subscribeToUpdates<StringValue>(identifier, storeName, listener);

    expect(subscribeToUpdates).toHaveBeenCalledWith(identifier, storeName, listener);
    expect(typeof unsubscribe).toBe('function');

    // Simulate an update
    await serverSet(identifier, storeName, updatedValue, new Date(), mode);

    expect(serverSet).toHaveBeenCalledWith(
      identifier,
      storeName,
      updatedValue,
      expect.any(Date),
      mode,
    );
    expect(listener).toHaveBeenCalledWith(updatedValue);

    log('Successfully subscribed to updates and received notifications');
  });

  it('should handle errors when subscribing', async () => {
    const identifier = 'error-subscribe';
    const errorMessage = 'Subscription error';

    (subscribeToUpdates as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(subscribeToUpdates(identifier, storeName, jest.fn())).rejects.toThrow(
      errorMessage,
    );

    log('Successfully handled subscription error');
  });

  it('should allow unsubscribing from updates', async () => {
    const identifier = 'unsubscribe-test';
    const listener = jest.fn();
    const unsubscribeMock = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(unsubscribeMock);

    const unsubscribe = await subscribeToUpdates(identifier, storeName, listener);

    expect(typeof unsubscribe).toBe('function');

    unsubscribe();

    expect(unsubscribeMock).toHaveBeenCalled();

    log('Successfully unsubscribed from updates');
  });

  it('should not receive updates after unsubscribing', async () => {
    const identifier = 'no-updates-after-unsubscribe';
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };
    const listener = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});

    const unsubscribe = await subscribeToUpdates<StringValue>(identifier, storeName, listener);

    // Unsubscribe
    unsubscribe();

    // Simulate an update after unsubscribing
    await serverSet(identifier, storeName, updatedValue, new Date(), mode);

    expect(listener).not.toHaveBeenCalled();

    log('Successfully verified no updates received after unsubscribing');
  });

  it('should handle multiple subscribers for the same identifier', async () => {
    const identifier = 'multi-subscriber';
    const updatedValue: StringValue = { type: 'string', value: 'multi-subscriber update' };
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    (subscribeToUpdates as jest.Mock).mockResolvedValue(() => {});

    await subscribeToUpdates<StringValue>(identifier, storeName, listener1);
    await subscribeToUpdates<StringValue>(identifier, storeName, listener2);

    // Simulate an update
    await serverSet(identifier, storeName, updatedValue, new Date(), mode);

    expect(listener1).toHaveBeenCalledWith(updatedValue);
    expect(listener2).toHaveBeenCalledWith(updatedValue);

    log('Successfully handled multiple subscribers for the same identifier');
  });
});
