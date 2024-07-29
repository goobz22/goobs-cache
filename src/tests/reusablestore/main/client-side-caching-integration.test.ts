import { set, get, remove, subscribeToUpdates } from '../../../reusableStore';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  setMockedGlobals,
} from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
  subscribeToUpdates: jest.fn(),
}));

const logStream: WriteStream = createLogStream('client-side-caching-integration-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Client-Side Caching Integration Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'client';

  beforeAll(() => {
    log('Starting Client-Side Caching Integration tests...');
    setupErrorHandling(log, logStream);
    setMockedGlobals();
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set a value in client-side cache', async () => {
    const identifier = 'set-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await set(identifier, storeName, value, mode, expirationDate);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expirationDate);
    log('Successfully set a value in client-side cache');
  });

  it('should get a value from client-side cache', async () => {
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
    log('Successfully got a value from client-side cache');
  });

  it('should remove a value from client-side cache', async () => {
    const identifier = 'remove-test';

    await remove(identifier, storeName, mode);

    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully removed a value from client-side cache');
  });

  it('should subscribe to updates in client-side cache', async () => {
    const identifier = 'subscribe-test';
    const listener = jest.fn();

    await subscribeToUpdates(identifier, storeName, listener, mode);

    expect(subscribeToUpdates).toHaveBeenCalledWith(identifier, storeName, listener, mode);
    log('Successfully subscribed to updates in client-side cache');
  });

  it('should handle cache misses in client-side cache', async () => {
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
    log('Successfully handled cache miss in client-side cache');
  });

  it('should update an existing value in client-side cache', async () => {
    const identifier = 'update-test';
    const initialValue: StringValue = { type: 'string', value: 'initial value' };
    const updatedValue: StringValue = { type: 'string', value: 'updated value' };

    await set(identifier, storeName, initialValue, mode);
    await set(identifier, storeName, updatedValue, mode);

    expect(set).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenLastCalledWith(identifier, storeName, updatedValue, mode, undefined);
    log('Successfully updated an existing value in client-side cache');
  });

  it('should handle concurrent operations in client-side cache', async () => {
    const identifier = 'concurrent-test';
    const value: StringValue = { type: 'string', value: 'concurrent test' };

    const operations = [
      set(identifier, storeName, value, mode),
      get(identifier, storeName, mode),
      remove(identifier, storeName, mode),
    ];

    await Promise.all(operations);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, undefined);
    expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(remove).toHaveBeenCalledWith(identifier, storeName, mode);
    log('Successfully handled concurrent operations in client-side cache');
  });

  it('should respect expiration dates in client-side cache', async () => {
    const identifier = 'expiration-test';
    const value: StringValue = { type: 'string', value: 'expiration test' };
    const expirationDate = new Date(Date.now() - 1000); // Expired 1 second ago

    await set(identifier, storeName, value, mode, expirationDate);

    (get as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    const result = await get(identifier, storeName, mode);

    expect(result.value).toBeUndefined();
    log('Successfully respected expiration dates in client-side cache');
  });
});
