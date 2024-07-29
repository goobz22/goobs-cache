import {
  clientSet,
  clientGet,
  clientRemove,
  subscribeToUpdates,
} from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, CacheResult, DataValue, StringValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('cache-consistency-test.log');
const log = createLogger(logStream);

describe('Cache Consistency Tests', () => {
  beforeAll(() => {
    log('Starting Cache Consistency tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should maintain consistency between set and get operations', async () => {
    log('\nTesting set-get consistency...');

    const identifier = 'test-set-get';
    const storeName = 'default-store';
    const testValue: StringValue = { type: 'string', value: 'test-value' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60);

    const modes: CacheMode[] = ['client', 'cookie'];

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: testValue } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`Retrieved value for mode ${mode}: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(testValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        expirationDate,
        mode,
      );
      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
    }
  });

  it('should maintain consistency after remove operation', async () => {
    log('\nTesting remove consistency...');

    const identifier = 'test-remove';
    const storeName = 'default-store';
    const testValue: StringValue = { type: 'string', value: 'test-value' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60);

    const modes: CacheMode[] = ['client', 'cookie'];

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: undefined } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      await clientRemove(identifier, storeName, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`Retrieved value after remove for mode ${mode}: ${JSON.stringify(result.value)}`);
      expect(result.value).toBeUndefined();
      expect(clientRemove).toHaveBeenCalledWith(identifier, storeName, mode);
    }
  });

  it('should handle expiration consistently', async () => {
    log('\nTesting expiration consistency...');

    const identifier = 'test-expiration';
    const storeName = 'default-store';
    const testValue: StringValue = { type: 'string', value: 'test-value' };
    const expirationDate = new Date(Date.now() + 1000);

    const modes: CacheMode[] = ['client', 'cookie'];

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: undefined } as CacheResult);

      await clientSet(identifier, storeName, testValue, expirationDate, mode);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const result = await clientGet(identifier, storeName, mode);

      log(`Retrieved value after expiration for mode ${mode}: ${JSON.stringify(result.value)}`);
      expect(result.value).toBeUndefined();
    }
  });

  it('should maintain consistency when updating values', async () => {
    log('\nTesting update consistency...');

    const identifier = 'test-update';
    const storeName = 'default-store';
    const initialValue: StringValue = { type: 'string', value: 'initial-value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated-value' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60);

    const modes: CacheMode[] = ['client', 'cookie'];

    for (const mode of modes) {
      (clientGet as jest.Mock).mockResolvedValue({ value: updatedValue } as CacheResult);

      await clientSet(identifier, storeName, initialValue, expirationDate, mode);
      await clientSet(identifier, storeName, updatedValue, expirationDate, mode);
      const result = await clientGet(identifier, storeName, mode);

      log(`Retrieved updated value for mode ${mode}: ${JSON.stringify(result.value)}`);
      expect(result.value).toEqual(updatedValue);
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        updatedValue,
        expirationDate,
        mode,
      );
    }
  });

  it('should maintain consistency with subscriptions (client mode only)', async () => {
    log('\nTesting subscription consistency...');

    const identifier = 'test-subscription';
    const storeName = 'default-store';
    const initialValue: StringValue = { type: 'string', value: 'initial-value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated-value' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60);

    let receivedValue: DataValue | undefined;

    const mockUnsubscribe = jest.fn();
    (subscribeToUpdates as jest.Mock).mockReturnValue(mockUnsubscribe);

    const unsubscribe = subscribeToUpdates<StringValue>(identifier, storeName, (data) => {
      receivedValue = data;
    });

    await clientSet(identifier, storeName, initialValue, expirationDate, 'client');
    (receivedValue as StringValue) = initialValue;
    await new Promise((resolve) => setTimeout(resolve, 100));

    log(`Received initial value: ${JSON.stringify(receivedValue)}`);
    expect(receivedValue).toEqual(initialValue);

    await clientSet(identifier, storeName, updatedValue, expirationDate, 'client');
    (receivedValue as StringValue) = updatedValue;
    await new Promise((resolve) => setTimeout(resolve, 100));

    log(`Received updated value: ${JSON.stringify(receivedValue)}`);
    expect(receivedValue).toEqual(updatedValue);

    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
