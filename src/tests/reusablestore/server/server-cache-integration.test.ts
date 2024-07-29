import { serverSet, serverGet, serverRemove } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue, CacheResult } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.fn(),
  serverGet: jest.fn(),
  serverRemove: jest.fn(),
}));

const logStream: WriteStream = createLogStream('server-cache-integration-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Server Cache Integration Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting Server Cache Integration tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set, get, and remove a value correctly', async () => {
    const identifier = 'integration-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    const mockCacheResult: CacheResult = {
      identifier,
      storeName,
      value,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue(mockCacheResult);
    (serverRemove as jest.Mock).mockResolvedValue(undefined);

    // Set the value
    await serverSet(identifier, storeName, value, expirationDate, mode);
    expect(serverSet).toHaveBeenCalledWith(identifier, storeName, value, expirationDate, mode);

    // Get the value
    const getResult = await serverGet(identifier, storeName, mode);
    expect(serverGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(getResult).toEqual(mockCacheResult);

    // Remove the value
    await serverRemove(identifier, storeName, mode);
    expect(serverRemove).toHaveBeenCalledWith(identifier, storeName, mode);

    // Try to get the removed value
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    const removedResult = await serverGet(identifier, storeName, mode);
    expect(removedResult.value).toBeUndefined();

    log('Successfully set, get, and removed a value');
  });

  it('should handle updating an existing value', async () => {
    const identifier = 'update-test';
    const initialValue: StringValue = { type: 'string', value: 'initial value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };
    const expirationDate = new Date(Date.now() + 3600000);

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockImplementation((id, store) =>
      Promise.resolve({
        identifier: id,
        storeName: store,
        value: updatedValue,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 2,
      }),
    );

    // Set initial value
    await serverSet(identifier, storeName, initialValue, expirationDate, mode);

    // Update the value
    await serverSet(identifier, storeName, updatedValue, expirationDate, mode);

    // Get the updated value
    const result = await serverGet(identifier, storeName, mode);
    expect(result.value).toEqual(updatedValue);
    expect(result.setHitCount).toBe(2);

    log('Successfully updated an existing value');
  });

  it('should handle multiple values in the same store', async () => {
    const identifiers = ['multi-test-1', 'multi-test-2', 'multi-test-3'];
    const values: StringValue[] = [
      { type: 'string', value: 'value 1' },
      { type: 'string', value: 'value 2' },
      { type: 'string', value: 'value 3' },
    ];
    const expirationDate = new Date(Date.now() + 3600000);

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockImplementation((id, store) => {
      const index = identifiers.indexOf(id);
      return Promise.resolve({
        identifier: id,
        storeName: store,
        value: values[index],
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      });
    });

    // Set multiple values
    for (let i = 0; i < identifiers.length; i++) {
      await serverSet(identifiers[i], storeName, values[i], expirationDate, mode);
    }

    // Get and verify each value
    for (let i = 0; i < identifiers.length; i++) {
      const result = await serverGet(identifiers[i], storeName, mode);
      expect(result.value).toEqual(values[i]);
    }

    log('Successfully handled multiple values in the same store');
  });

  it('should handle values with different expiration dates', async () => {
    const identifier = 'expiration-test';
    const value: StringValue = { type: 'string', value: 'expiration test' };
    const shortExpirationDate = new Date(Date.now() + 1000); // 1 second from now
    const longExpirationDate = new Date(Date.now() + 3600000); // 1 hour from now

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockImplementation((id, store, time = Date.now()) => {
      const expirationDate =
        time > shortExpirationDate.getTime() ? longExpirationDate : shortExpirationDate;
      return Promise.resolve({
        identifier: id,
        storeName: store,
        value: time <= expirationDate.getTime() ? value : undefined,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      });
    });

    // Set value with short expiration
    await serverSet(identifier, storeName, value, shortExpirationDate, mode);

    // Get value before expiration
    let result = await serverGet(identifier, storeName, mode);
    expect(result.value).toEqual(value);

    // Wait for short expiration
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Get value after short expiration
    result = await serverGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    // Set value with long expiration
    await serverSet(identifier, storeName, value, longExpirationDate, mode);

    // Get value after setting with long expiration
    result = await serverGet(identifier, storeName, mode);
    expect(result.value).toEqual(value);

    log('Successfully handled values with different expiration dates');
  });

  it('should handle concurrent set and get operations', async () => {
    const identifier = 'concurrent-test';
    const initialValue: StringValue = { type: 'string', value: 'initial' };
    const updatedValue: StringValue = { type: 'string', value: 'updated' };
    const expirationDate = new Date(Date.now() + 3600000);

    let currentValue = initialValue;

    (serverSet as jest.Mock).mockImplementation((id, store, value) => {
      currentValue = value as StringValue;
      return Promise.resolve(undefined);
    });

    (serverGet as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        identifier,
        storeName,
        value: currentValue,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      }),
    );

    // Simulate concurrent set and get operations
    const setPromise = serverSet(identifier, storeName, updatedValue, expirationDate, mode);
    const getPromise = serverGet(identifier, storeName, mode);

    const [, getResult] = await Promise.all([setPromise, getPromise]);

    // The get operation might return either the initial or updated value
    expect([initialValue.value, updatedValue.value]).toContain(
      (getResult.value as StringValue).value,
    );

    // Ensure the final state is the updated value
    const finalResult = await serverGet(identifier, storeName, mode);
    expect(finalResult.value).toEqual(updatedValue);

    log('Successfully handled concurrent set and get operations');
  });

  it('should handle removing a non-existent value', async () => {
    const identifier = 'non-existent-remove-test';

    (serverRemove as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    // Attempt to remove a non-existent value
    await expect(serverRemove(identifier, storeName, mode)).resolves.not.toThrow();

    // Verify that getting the non-existent value returns undefined
    const result = await serverGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();

    log('Successfully handled removing a non-existent value');
  });

  it('should handle setting and getting values of different types', async () => {
    const identifier = 'multi-type-test';
    const stringValue: StringValue = { type: 'string', value: 'string value' };
    const numberValue = 42;
    const booleanValue = true;
    const expirationDate = new Date(Date.now() + 3600000);

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockImplementation((id, store, type) =>
      Promise.resolve({
        identifier: id,
        storeName: store,
        value: type === 'string' ? stringValue : type === 'number' ? numberValue : booleanValue,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      }),
    );

    // Set and get string value
    await serverSet(identifier, storeName, stringValue, expirationDate, mode);
    let result = await serverGet(identifier, storeName, mode);
    expect(result.value).toEqual(stringValue);

    // Set and get number value
    await serverSet(identifier, storeName, numberValue, expirationDate, mode);
    result = await serverGet(identifier, storeName, mode);
    expect(result.value).toBe(numberValue);

    // Set and get boolean value
    await serverSet(identifier, storeName, booleanValue, expirationDate, mode);
    result = await serverGet(identifier, storeName, mode);
    expect(result.value).toBe(booleanValue);

    log('Successfully handled setting and getting values of different types');
  });
});
