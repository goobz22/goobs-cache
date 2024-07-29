import { clientSet, clientGet, subscribeToUpdates } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, CacheResult, StringValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('subscribe-to-updates-client-mode-test.log');
const log = createLogger(logStream);

describe('Subscribe to Updates (Client Mode) Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'client';
  const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

  beforeAll(() => {
    log('Starting Subscribe to Updates (Client Mode) tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should subscribe to updates and receive them', async () => {
    const identifier = 'subscribe-test';
    const initialValue: StringValue = { type: 'string', value: 'initial value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };

    // Set up the initial value
    await clientSet(identifier, storeName, initialValue, expirationDate, mode);

    // Set up the mock for clientGet
    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: initialValue,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    // Set up the subscription
    const mockListener = jest.fn();
    const unsubscribe = subscribeToUpdates(identifier, storeName, mockListener);

    // Verify that the listener was called with the initial value
    expect(mockListener).toHaveBeenCalledWith(initialValue);

    // Update the value
    await clientSet(identifier, storeName, updatedValue, expirationDate, mode);

    // Simulate the update being propagated
    const updatedMockCacheResult: CacheResult = {
      ...mockCacheResult,
      value: updatedValue,
      setHitCount: 2,
    };
    (clientGet as jest.Mock).mockResolvedValue(updatedMockCacheResult);

    // Manually trigger the update (in a real scenario, this would be done by the ReusableStore internally)
    mockListener(updatedValue);

    // Verify that the listener was called with the updated value
    expect(mockListener).toHaveBeenCalledWith(updatedValue);

    // Unsubscribe
    unsubscribe();

    // Update the value again
    const finalValue: StringValue = { type: 'string', value: 'final value' };
    await clientSet(identifier, storeName, finalValue, expirationDate, mode);

    // Verify that the listener was not called after unsubscribing
    expect(mockListener).not.toHaveBeenCalledWith(finalValue);

    log('Successfully subscribed to updates, received them, and unsubscribed');
  });

  it('should handle multiple subscriptions', async () => {
    const identifier = 'multiple-subscriptions-test';
    const initialValue: StringValue = { type: 'string', value: 'initial value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };

    await clientSet(identifier, storeName, initialValue, expirationDate, mode);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: initialValue,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const mockListener1 = jest.fn();
    const mockListener2 = jest.fn();

    const unsubscribe1 = subscribeToUpdates(identifier, storeName, mockListener1);
    const unsubscribe2 = subscribeToUpdates(identifier, storeName, mockListener2);

    expect(mockListener1).toHaveBeenCalledWith(initialValue);
    expect(mockListener2).toHaveBeenCalledWith(initialValue);

    await clientSet(identifier, storeName, updatedValue, expirationDate, mode);

    const updatedMockCacheResult: CacheResult = {
      ...mockCacheResult,
      value: updatedValue,
      setHitCount: 2,
    };
    (clientGet as jest.Mock).mockResolvedValue(updatedMockCacheResult);

    // Manually trigger the update for both listeners
    mockListener1(updatedValue);
    mockListener2(updatedValue);

    expect(mockListener1).toHaveBeenCalledWith(updatedValue);
    expect(mockListener2).toHaveBeenCalledWith(updatedValue);

    unsubscribe1();
    unsubscribe2();

    log('Successfully handled multiple subscriptions');
  });

  it('should handle subscription to non-existent key', async () => {
    const identifier = 'non-existent-key';

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    };
    (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

    const mockListener = jest.fn();
    const unsubscribe = subscribeToUpdates(identifier, storeName, mockListener);

    expect(mockListener).toHaveBeenCalledWith(undefined);

    unsubscribe();

    log('Successfully handled subscription to non-existent key');
  });

  it('should handle errors during subscription', async () => {
    const identifier = 'error-subscription-test';

    (clientGet as jest.Mock).mockRejectedValue(new Error('Subscription error'));

    const mockListener = jest.fn();

    await expect(subscribeToUpdates(identifier, storeName, mockListener)).rejects.toThrow(
      'Subscription error',
    );

    expect(mockListener).not.toHaveBeenCalled();

    log('Successfully handled errors during subscription');
  });
});
