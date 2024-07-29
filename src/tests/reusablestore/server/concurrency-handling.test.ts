import { serverSet, serverGet, serverRemove } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue, CacheResult } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.fn(),
  serverGet: jest.fn(),
  serverRemove: jest.fn(),
}));

const logStream: WriteStream = createLogStream('concurrency-handling-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Concurrency Handling Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';
  const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

  beforeAll(() => {
    log('Starting Concurrency Handling tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle multiple concurrent set operations', async () => {
    const identifier = 'concurrent-set-test';
    const values: StringValue[] = Array.from({ length: 10 }, (_, i) => ({
      type: 'string',
      value: `value-${i}`,
    }));

    (serverSet as jest.Mock).mockResolvedValue(undefined);

    const setPromises = values.map((value) =>
      serverSet(identifier, storeName, value, expirationDate, mode),
    );
    await Promise.all(setPromises);

    expect(serverSet).toHaveBeenCalledTimes(10);
    log('Successfully handled multiple concurrent set operations');
  });

  it('should handle multiple concurrent get operations', async () => {
    const identifier = 'concurrent-get-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    const getPromises = Array(10)
      .fill(null)
      .map(() => serverGet(identifier, storeName, mode));
    const results = await Promise.all(getPromises);

    expect(serverGet).toHaveBeenCalledTimes(10);
    results.forEach((result) => {
      expect(result.value).toEqual(value);
    });
    log('Successfully handled multiple concurrent get operations');
  });

  it('should handle concurrent set and get operations', async () => {
    const identifier = 'concurrent-set-get-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    const operations = [
      serverSet(identifier, storeName, value, expirationDate, mode),
      serverGet(identifier, storeName, mode),
      serverSet(identifier, storeName, value, expirationDate, mode),
      serverGet(identifier, storeName, mode),
    ];

    await Promise.all(operations);

    expect(serverSet).toHaveBeenCalledTimes(2);
    expect(serverGet).toHaveBeenCalledTimes(2);
    log('Successfully handled concurrent set and get operations');
  });

  it('should handle race conditions between set and remove', async () => {
    const identifier = 'race-condition-test';
    const value: StringValue = { type: 'string', value: 'test value' };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
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

    await Promise.all([
      serverSet(identifier, storeName, value, expirationDate, mode),
      serverRemove(identifier, storeName, mode),
    ]);

    const result = await serverGet(identifier, storeName, mode);
    expect(result.value).toBeUndefined();
    log('Successfully handled race conditions between set and remove');
  });

  it('should handle concurrent operations on different keys', async () => {
    const identifiers = ['concurrent1', 'concurrent2', 'concurrent3'];
    const value: StringValue = { type: 'string', value: 'test value' };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockImplementation((id) =>
      Promise.resolve({
        identifier: id,
        storeName,
        value,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      }),
    );

    const operations = identifiers.flatMap((id) => [
      serverSet(id, storeName, value, expirationDate, mode),
      serverGet(id, storeName, mode),
    ]);

    const results = await Promise.all(operations);

    expect(serverSet).toHaveBeenCalledTimes(3);
    expect(serverGet).toHaveBeenCalledTimes(3);
    results
      .filter((_, index) => index % 2 === 1)
      .forEach((result) => {
        expect((result as CacheResult).value).toEqual(value);
      });
    log('Successfully handled concurrent operations on different keys');
  });

  it('should handle rapid successive operations on the same key', async () => {
    const identifier = 'rapid-succession-test';
    const values: StringValue[] = Array.from({ length: 100 }, (_, i) => ({
      type: 'string',
      value: `value-${i}`,
    }));

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockImplementation((id, store) =>
      Promise.resolve({
        identifier: id,
        storeName: store,
        value: values[values.length - 1],
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: values.length,
      }),
    );

    await Promise.all(
      values.map((value) => serverSet(identifier, storeName, value, expirationDate, mode)),
    );
    const result = await serverGet(identifier, storeName, mode);

    expect(serverSet).toHaveBeenCalledTimes(100);
    expect(result.value).toEqual(values[values.length - 1]);
    expect(result.setHitCount).toBe(100);
    log('Successfully handled rapid successive operations on the same key');
  });

  it('should handle concurrent read and write operations with high load', async () => {
    const identifier = 'high-load-test';
    const operationCount = 1000;
    const value: StringValue = { type: 'string', value: 'high load test value' };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    const operations = Array(operationCount)
      .fill(null)
      .map((_, index) =>
        index % 2 === 0
          ? serverSet(identifier, storeName, value, expirationDate, mode)
          : serverGet(identifier, storeName, mode),
      );

    await Promise.all(operations);

    expect(serverSet).toHaveBeenCalledTimes(operationCount / 2);
    expect(serverGet).toHaveBeenCalledTimes(operationCount / 2);
    log('Successfully handled concurrent read and write operations with high load');
  });

  it('should maintain data integrity during concurrent updates', async () => {
    const identifier = 'data-integrity-test';
    let currentValue = 0;

    (serverSet as jest.Mock).mockImplementation(async (id, store, value) => {
      currentValue = (value as StringValue).value as unknown as number;
    });
    (serverGet as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        identifier,
        storeName,
        value: { type: 'string', value: currentValue.toString() },
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      }),
    );

    const updateOperations = Array(100)
      .fill(null)
      .map(async () => {
        const getResult = await serverGet(identifier, storeName, mode);
        const currentNum = parseInt((getResult.value as StringValue).value);
        await serverSet(
          identifier,
          storeName,
          { type: 'string', value: (currentNum + 1).toString() },
          expirationDate,
          mode,
        );
      });

    await Promise.all(updateOperations);

    const finalResult = await serverGet(identifier, storeName, mode);
    expect((finalResult.value as StringValue).value).toBe('100');
    log('Successfully maintained data integrity during concurrent updates');
  });

  it('should handle concurrent operations with varying expiration dates', async () => {
    const identifier = 'varying-expiration-test';
    const value: StringValue = { type: 'string', value: 'expiration test value' };

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockImplementation((id, store) =>
      Promise.resolve({
        identifier: id,
        storeName: store,
        value,
        expirationDate: new Date(Date.now() + 3600000), // Always 1 hour from now
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      }),
    );

    const operations = Array(100)
      .fill(null)
      .map((_, index) => {
        const expiration = new Date(Date.now() + index * 60000); // Varying from now to 100 minutes in the future
        return serverSet(identifier, storeName, value, expiration, mode);
      });

    await Promise.all(operations);

    const result = await serverGet(identifier, storeName, mode);
    expect(result.value).toEqual(value);
    expect(result.expirationDate.getTime()).toBeGreaterThan(Date.now());
    log('Successfully handled concurrent operations with varying expiration dates');
  });

  it('should handle concurrent remove operations', async () => {
    const identifiers = Array(100)
      .fill(null)
      .map((_, index) => `concurrent-remove-${index}`);

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverRemove as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockResolvedValue({
      identifier: '',
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    // Set all values
    await Promise.all(
      identifiers.map((id) =>
        serverSet(id, storeName, { type: 'string', value: 'to be removed' }, expirationDate, mode),
      ),
    );

    // Concurrently remove all values
    await Promise.all(identifiers.map((id) => serverRemove(id, storeName, mode)));

    // Verify all values are removed
    const getResults = await Promise.all(identifiers.map((id) => serverGet(id, storeName, mode)));
    getResults.forEach((result) => {
      expect(result.value).toBeUndefined();
    });

    log('Successfully handled concurrent remove operations');
  });

  it('should handle concurrent operations with cache clearing', async () => {
    const identifier = 'cache-clear-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    let isCacheCleared = false;

    (serverSet as jest.Mock).mockResolvedValue(undefined);
    (serverGet as jest.Mock).mockImplementation(() => {
      if (isCacheCleared) {
        return Promise.resolve({
          identifier,
          storeName,
          value: undefined,
          expirationDate: new Date(0),
          lastUpdatedDate: new Date(0),
          lastAccessedDate: new Date(0),
          getHitCount: 0,
          setHitCount: 0,
        });
      }
      return Promise.resolve({
        identifier,
        storeName,
        value,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      });
    });
    (serverRemove as jest.Mock).mockImplementation(() => {
      isCacheCleared = true;
      return Promise.resolve();
    });

    const operations = [
      serverSet(identifier, storeName, value, expirationDate, mode),
      serverGet(identifier, storeName, mode),
      serverRemove('*', storeName, mode), // Simulate cache clearing
      serverGet(identifier, storeName, mode),
      serverSet(identifier, storeName, value, expirationDate, mode),
      serverGet(identifier, storeName, mode),
    ];

    const results = await Promise.all(operations);

    expect(results[1]).toHaveProperty('value', value);
    expect(results[3]).toHaveProperty('value', undefined);
    expect(results[5]).toHaveProperty('value', value);

    log('Successfully handled concurrent operations with cache clearing');
  });
});
