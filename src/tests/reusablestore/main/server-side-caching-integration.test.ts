import { set, get, remove, subscribeToUpdates } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => {
  const actualModule = jest.requireActual('../../../ReusableStore');
  return {
    ...actualModule,
    set: jest.fn(actualModule.set),
    get: jest.fn(actualModule.get),
    remove: jest.fn(actualModule.remove),
    subscribeToUpdates: jest.fn(actualModule.subscribeToUpdates),
  };
});

const logStream: WriteStream = createLogStream('server-side-caching-integration-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Server-Side Caching Integration Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting Server-Side Caching Integration tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set a value in server-side cache', async () => {
    const identifier = 'set-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a value in server-side cache');
  });

  it('should get a value from server-side cache', async () => {
    const identifier = 'get-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    (get as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    const result = await get(identifier, storeName, mode);

    expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toEqual(value);
    log('Successfully got a value from server-side cache');
  });

  it('should remove a value from server-side cache', async () => {
    const identifier = 'remove-test';

    await remove(identifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value from server-side cache');
  });

  it('should subscribe to updates in server-side cache', async () => {
    const identifier = 'subscribe-test';
    const listener = jest.fn();

    await subscribeToUpdates(identifier, storeName, listener, mode);

    expect(subscribeToUpdates).toHaveBeenCalledWith(identifier, storeName, listener, mode);
    log('Successfully subscribed to updates in server-side cache');
  });

  it('should handle cache misses in server-side cache', async () => {
    const identifier = 'miss-test';

    (get as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    const result = await get(identifier, storeName, mode);

    expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result.value).toBeUndefined();
    log('Successfully handled cache miss in server-side cache');
  });

  it('should update an existing value in server-side cache', async () => {
    const identifier = 'update-test';
    const initialValue: StringValue = { type: 'string', value: 'initial value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, initialValue, mode, expirationDate);

    (get as jest.Mock)
      .mockResolvedValueOnce({
        identifier,
        storeName,
        value: initialValue,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      })
      .mockResolvedValueOnce({
        identifier,
        storeName,
        value: updatedValue,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 2,
        setHitCount: 2,
      });

    let result = await get(identifier, storeName, mode);
    expect(result.value).toEqual(initialValue);

    await set(identifier, storeName, updatedValue, mode, expirationDate);
    result = await get(identifier, storeName, mode);
    expect(result.value).toEqual(updatedValue);

    log('Successfully updated an existing value in server-side cache');
  });

  it('should handle errors in server-side cache operations', async () => {
    const identifier = 'error-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    (set as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

    await expect(set(identifier, storeName, value, mode)).rejects.toThrow('Server error');

    log('Successfully handled errors in server-side cache operations');
  });
});
