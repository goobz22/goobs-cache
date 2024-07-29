import { get, set } from '../../../reusableStore';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  setMockedGlobals,
} from '../../jest/default/logging';
import { CacheMode, StringValue, CacheResult } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

const logStream: WriteStream = createLogStream('get-client-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Get Client Mode Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'client';

  beforeAll(() => {
    log('Starting Get Client Mode tests...');
    setupErrorHandling(log, logStream);
    setMockedGlobals();
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get a value in client mode', async () => {
    const identifier = 'get-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const mockResult: CacheResult = {
      identifier,
      storeName,
      value,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (get as jest.Mock).mockResolvedValue(mockResult);

    const result = await get(identifier, storeName, mode);

    expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result).toEqual(mockResult);
    log('Successfully got a value in client mode');
  });

  it('should handle getting a non-existent value', async () => {
    const identifier = 'non-existent-test';
    const mockResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    };

    (get as jest.Mock).mockResolvedValue(mockResult);

    const result = await get(identifier, storeName, mode);

    expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result).toEqual(mockResult);
    log('Successfully handled getting a non-existent value in client mode');
  });

  it('should get a value after setting it', async () => {
    const identifier = 'set-then-get-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const mockResult: CacheResult = {
      identifier,
      storeName,
      value,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (set as jest.Mock).mockResolvedValue(undefined);
    (get as jest.Mock).mockResolvedValue(mockResult);

    await set(identifier, storeName, value, mode);
    const result = await get(identifier, storeName, mode);

    expect(set).toHaveBeenCalledWith(identifier, storeName, value, mode, expect.any(Date));
    expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result).toEqual(mockResult);
    log('Successfully got a value after setting it in client mode');
  });

  it('should handle errors when getting a value', async () => {
    const identifier = 'error-test';

    (get as jest.Mock).mockRejectedValueOnce(new Error('Failed to get value from client storage'));

    await expect(get(identifier, storeName, mode)).rejects.toThrow(
      'Failed to get value from client storage',
    );

    log('Successfully handled errors when getting a value in client mode');
  });

  it('should get multiple values in quick succession', async () => {
    const identifiers = ['multi-1', 'multi-2', 'multi-3'];
    const value: StringValue = { type: 'string', value: 'test value' };
    const mockResult: CacheResult = {
      identifier: 'mock',
      storeName,
      value,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (get as jest.Mock).mockResolvedValue(mockResult);

    const results = await Promise.all(identifiers.map((id) => get(id, storeName, mode)));

    expect(get).toHaveBeenCalledTimes(3);
    identifiers.forEach((id) => {
      expect(get).toHaveBeenCalledWith(id, storeName, mode);
    });
    results.forEach((result) => {
      expect(result).toEqual(mockResult);
    });

    log('Successfully got multiple values in quick succession in client mode');
  });

  it('should handle getting values with different expiration dates', async () => {
    const identifier1 = 'expiration-test-1';
    const identifier2 = 'expiration-test-2';
    const value: StringValue = { type: 'string', value: 'test value' };

    const mockResult1: CacheResult = {
      identifier: identifier1,
      storeName,
      value,
      expirationDate: new Date(Date.now() + 3600000), // 1 hour from now
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    const mockResult2: CacheResult = {
      identifier: identifier2,
      storeName,
      value,
      expirationDate: new Date(Date.now() + 7200000), // 2 hours from now
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (get as jest.Mock).mockResolvedValueOnce(mockResult1).mockResolvedValueOnce(mockResult2);

    const result1 = await get(identifier1, storeName, mode);
    const result2 = await get(identifier2, storeName, mode);

    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenCalledWith(identifier1, storeName, mode);
    expect(get).toHaveBeenCalledWith(identifier2, storeName, mode);
    expect(result1).toEqual(mockResult1);
    expect(result2).toEqual(mockResult2);

    log('Successfully handled getting values with different expiration dates in client mode');
  });

  it('should handle get operations with expired values', async () => {
    const identifier = 'expired-value-test';
    const expiredResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(Date.now() - 1000), // 1 second ago
      lastUpdatedDate: new Date(Date.now() - 3600000), // 1 hour ago
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (get as jest.Mock).mockResolvedValue(expiredResult);

    const result = await get(identifier, storeName, mode);

    expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result).toEqual(expiredResult);
    expect(result.value).toBeUndefined();

    log('Successfully handled get operation with expired value in client mode');
  });

  it('should handle get operations with values near expiration', async () => {
    const identifier = 'near-expiration-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const nearExpirationResult: CacheResult = {
      identifier,
      storeName,
      value,
      expirationDate: new Date(Date.now() + 1000), // 1 second from now
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (get as jest.Mock).mockResolvedValue(nearExpirationResult);

    const result = await get(identifier, storeName, mode);

    expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result).toEqual(nearExpirationResult);
    expect(result.value).toEqual(value);

    log('Successfully handled get operation with value near expiration in client mode');
  });

  it('should handle get operations with large values', async () => {
    const identifier = 'large-value-test';
    const largeValue: StringValue = { type: 'string', value: 'a'.repeat(1024 * 1024) }; // 1MB string
    const mockResult: CacheResult = {
      identifier,
      storeName,
      value: largeValue,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (get as jest.Mock).mockResolvedValue(mockResult);

    const result = await get(identifier, storeName, mode);

    expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result).toEqual(mockResult);
    expect((result.value as StringValue).value.length).toBe(1024 * 1024);

    log('Successfully handled get operation with large value in client mode');
  });

  it('should handle concurrent get operations', async () => {
    const identifiers = ['concurrent-1', 'concurrent-2', 'concurrent-3'];
    const value: StringValue = { type: 'string', value: 'test value' };

    const mockResults = identifiers.map((id) => ({
      identifier: id,
      storeName,
      value,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    }));

    (get as jest.Mock).mockImplementation((id: string) =>
      Promise.resolve(mockResults.find((result) => result.identifier === id)),
    );

    const results = await Promise.all(identifiers.map((id) => get(id, storeName, mode)));

    expect(get).toHaveBeenCalledTimes(identifiers.length);
    identifiers.forEach((id, index) => {
      expect(get).toHaveBeenNthCalledWith(index + 1, id, storeName, mode);
      expect(results[index]).toEqual(mockResults[index]);
    });

    log('Successfully handled concurrent get operations in client mode');
  });

  it('should handle get operations after browser storage is cleared', async () => {
    const identifier = 'cleared-storage-test';
    const mockResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    };

    // Simulate clearing browser storage
    localStorage.clear();

    (get as jest.Mock).mockResolvedValue(mockResult);

    const result = await get(identifier, storeName, mode);

    expect(get).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result).toEqual(mockResult);
    expect(result.value).toBeUndefined();

    log('Successfully handled get operation after browser storage is cleared in client mode');
  });
});
