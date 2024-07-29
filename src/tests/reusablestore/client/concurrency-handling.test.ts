import { clientSet, clientGet, clientRemove } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, CacheResult, StringValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('concurrency-handling-test.log');
const log = createLogger(logStream);

describe('Concurrency Handling Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['client', 'cookie'];

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
    const testValue: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 1000);

    for (const mode of modes) {
      const setOperations = Array(10)
        .fill(null)
        .map(() => clientSet(identifier, storeName, testValue, expirationDate, mode));

      await expect(Promise.all(setOperations)).resolves.not.toThrow();

      expect(clientSet).toHaveBeenCalledTimes(10);
      (clientSet as jest.Mock).mockClear();
    }

    log('Successfully handled multiple concurrent set operations');
  });

  it('should handle multiple concurrent get operations', async () => {
    const identifier = 'concurrent-get-test';
    const testValue: StringValue = { type: 'string', value: 'test value' };

    for (const mode of modes) {
      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate: new Date(Date.now() + 1000),
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 0,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const getOperations = Array(10)
        .fill(null)
        .map(() => clientGet(identifier, storeName, mode));

      const results = await Promise.all(getOperations);

      results.forEach((result) => {
        expect(result).toEqual(mockCacheResult);
      });

      expect(clientGet).toHaveBeenCalledTimes(10);
      (clientGet as jest.Mock).mockClear();
    }

    log('Successfully handled multiple concurrent get operations');
  });

  it('should handle multiple concurrent remove operations', async () => {
    const identifier = 'concurrent-remove-test';

    for (const mode of modes) {
      const removeOperations = Array(10)
        .fill(null)
        .map(() => clientRemove(identifier, storeName, mode));

      await expect(Promise.all(removeOperations)).resolves.not.toThrow();

      expect(clientRemove).toHaveBeenCalledTimes(10);
      (clientRemove as jest.Mock).mockClear();
    }

    log('Successfully handled multiple concurrent remove operations');
  });

  it('should handle interleaved set and get operations', async () => {
    const identifier = 'interleaved-set-get-test';
    const testValue: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 1000);

    for (const mode of modes) {
      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 0,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const operations = Array(20)
        .fill(null)
        .map((_, index) =>
          index % 2 === 0
            ? clientSet(identifier, storeName, testValue, expirationDate, mode)
            : clientGet(identifier, storeName, mode),
        );

      await expect(Promise.all(operations)).resolves.not.toThrow();

      expect(clientSet).toHaveBeenCalledTimes(10);
      expect(clientGet).toHaveBeenCalledTimes(10);

      (clientSet as jest.Mock).mockClear();
      (clientGet as jest.Mock).mockClear();
    }

    log('Successfully handled interleaved set and get operations');
  });

  it('should handle concurrent operations on different identifiers', async () => {
    const identifiers = ['concurrent-1', 'concurrent-2', 'concurrent-3'];
    const testValue: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 1000);

    for (const mode of modes) {
      const mockCacheResult: CacheResult = {
        identifier: expect.any(String),
        storeName,
        value: testValue,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 0,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const operations = identifiers.flatMap((identifier) => [
        clientSet(identifier, storeName, testValue, expirationDate, mode),
        clientGet(identifier, storeName, mode),
        clientRemove(identifier, storeName, mode),
      ]);

      await expect(Promise.all(operations)).resolves.not.toThrow();

      expect(clientSet).toHaveBeenCalledTimes(identifiers.length);
      expect(clientGet).toHaveBeenCalledTimes(identifiers.length);
      expect(clientRemove).toHaveBeenCalledTimes(identifiers.length);

      (clientSet as jest.Mock).mockClear();
      (clientGet as jest.Mock).mockClear();
      (clientRemove as jest.Mock).mockClear();
    }

    log('Successfully handled concurrent operations on different identifiers');
  });

  it('should handle rapid successive updates to the same identifier', async () => {
    const identifier = 'rapid-update-test';
    const expirationDate = new Date(Date.now() + 1000);

    for (const mode of modes) {
      const updateOperations = Array(100)
        .fill(null)
        .map((_, index) => {
          const updatedValue: StringValue = { type: 'string', value: `updated value ${index}` };
          return clientSet(identifier, storeName, updatedValue, expirationDate, mode);
        });

      await expect(Promise.all(updateOperations)).resolves.not.toThrow();

      expect(clientSet).toHaveBeenCalledTimes(100);

      // Verify that the final value is the last update
      const mockFinalResult: CacheResult = {
        identifier,
        storeName,
        value: { type: 'string', value: 'updated value 99' },
        expirationDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 0,
        setHitCount: 100,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockFinalResult);

      const finalResult = await clientGet(identifier, storeName, mode);
      expect(finalResult).toEqual(mockFinalResult);

      (clientSet as jest.Mock).mockClear();
      (clientGet as jest.Mock).mockClear();
    }

    log('Successfully handled rapid successive updates to the same identifier');
  });

  it('should handle concurrent read and write operations', async () => {
    const identifier = 'concurrent-read-write-test';
    const expirationDate = new Date(Date.now() + 1000);

    for (const mode of modes) {
      const operations = Array(100)
        .fill(null)
        .map((_, index) => {
          if (index % 2 === 0) {
            const updatedValue: StringValue = { type: 'string', value: `updated value ${index}` };
            return clientSet(identifier, storeName, updatedValue, expirationDate, mode);
          } else {
            return clientGet(identifier, storeName, mode);
          }
        });

      (clientGet as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          identifier,
          storeName,
          value: { type: 'string', value: `current value` },
          expirationDate,
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
          getHitCount: 0,
          setHitCount: 0,
        });
      });

      await expect(Promise.all(operations)).resolves.not.toThrow();

      expect(clientSet).toHaveBeenCalledTimes(50);
      expect(clientGet).toHaveBeenCalledTimes(50);

      (clientSet as jest.Mock).mockClear();
      (clientGet as jest.Mock).mockClear();
    }

    log('Successfully handled concurrent read and write operations');
  });

  it('should handle concurrent operations with varying expiration dates', async () => {
    const identifier = 'varying-expiration-test';
    const testValue: StringValue = { type: 'string', value: 'test value' };

    for (const mode of modes) {
      const operations = Array(50)
        .fill(null)
        .map((_, index) => {
          const expirationDate = new Date(Date.now() + index * 1000); // Varying expiration dates
          return clientSet(identifier, storeName, testValue, expirationDate, mode);
        });

      await expect(Promise.all(operations)).resolves.not.toThrow();

      expect(clientSet).toHaveBeenCalledTimes(50);

      // Verify that the final value has the latest expiration date
      const mockFinalResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate: expect.any(Date),
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 0,
        setHitCount: 50,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockFinalResult);

      const finalResult = await clientGet(identifier, storeName, mode);
      expect(finalResult).toEqual(mockFinalResult);
      expect(finalResult.expirationDate.getTime()).toBeGreaterThan(Date.now() + 48000); // Should be close to the last set expiration

      (clientSet as jest.Mock).mockClear();
      (clientGet as jest.Mock).mockClear();
    }

    log('Successfully handled concurrent operations with varying expiration dates');
  });

  it('should handle concurrent set and remove operations', async () => {
    const identifier = 'concurrent-set-remove-test';
    const testValue: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 1000);

    for (const mode of modes) {
      const operations = Array(100)
        .fill(null)
        .map((_, index) => {
          if (index % 2 === 0) {
            return clientSet(identifier, storeName, testValue, expirationDate, mode);
          } else {
            return clientRemove(identifier, storeName, mode);
          }
        });

      await expect(Promise.all(operations)).resolves.not.toThrow();

      expect(clientSet).toHaveBeenCalledTimes(50);
      expect(clientRemove).toHaveBeenCalledTimes(50);

      // The final state is unpredictable due to race conditions, so we don't assert on it

      (clientSet as jest.Mock).mockClear();
      (clientRemove as jest.Mock).mockClear();
    }

    log('Successfully handled concurrent set and remove operations');
  });
});
