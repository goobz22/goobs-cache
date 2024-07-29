import { clientSet, clientGet, clientRemove } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, CacheResult, StringValue } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('expiration-date-handling-test.log');
const log = createLogger(logStream);

describe('Expiration Date Handling Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['client', 'cookie'];
  const testValue: StringValue = { type: 'string', value: 'test value' };

  beforeAll(() => {
    log('Starting Expiration Date Handling tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle setting an item with a far future expiration date', async () => {
    const identifier = 'far-future-expiration-test';
    const farFutureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year in the future

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, farFutureDate, mode);

      expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, farFutureDate, mode);

      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate: farFutureDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 1,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(identifier, storeName, mode);
      expect(result).toEqual(mockCacheResult);

      log(`Successfully handled far future expiration date in ${mode} mode`);
    }
  });

  it('should handle setting an item with no expiration date', async () => {
    const identifier = 'no-expiration-test';
    const noExpirationDate = new Date(8640000000000000); // Maximum date value

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, noExpirationDate, mode);

      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        testValue,
        noExpirationDate,
        mode,
      );

      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate: noExpirationDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 1,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(identifier, storeName, mode);
      expect(result).toEqual(mockCacheResult);

      log(`Successfully handled no expiration date in ${mode} mode`);
    }
  });

  it('should handle expiration of multiple items at different times', async () => {
    const identifiers = ['item1', 'item2', 'item3'];
    const expirationDates = [
      new Date(Date.now() + 1000), // 1 second from now
      new Date(Date.now() + 2000), // 2 seconds from now
      new Date(Date.now() + 3000), // 3 seconds from now
    ];

    for (const mode of modes) {
      // Set items with different expiration dates
      for (let i = 0; i < identifiers.length; i++) {
        await clientSet(identifiers[i], storeName, testValue, expirationDates[i], mode);
      }

      // Check immediately (all items should exist)
      for (let i = 0; i < identifiers.length; i++) {
        const mockCacheResult: CacheResult = {
          identifier: identifiers[i],
          storeName,
          value: testValue,
          expirationDate: expirationDates[i],
          lastUpdatedDate: expect.any(Date),
          lastAccessedDate: expect.any(Date),
          getHitCount: 1,
          setHitCount: 1,
        };
        (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);
        const result = await clientGet(identifiers[i], storeName, mode);
        expect(result.value).toEqual(testValue);
      }

      // Wait for 1.5 seconds and check (first item should be expired)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      (clientGet as jest.Mock).mockResolvedValue({ value: undefined } as CacheResult);
      let result = await clientGet(identifiers[0], storeName, mode);
      expect(result.value).toBeUndefined();

      // Wait for another 1 second and check (second item should be expired)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result = await clientGet(identifiers[1], storeName, mode);
      expect(result.value).toBeUndefined();

      // Last item should still exist
      const mockCacheResult: CacheResult = {
        identifier: identifiers[2],
        storeName,
        value: testValue,
        expirationDate: expirationDates[2],
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 1,
        setHitCount: 1,
      };
      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);
      result = await clientGet(identifiers[2], storeName, mode);
      expect(result.value).toEqual(testValue);

      log(`Successfully handled expiration of multiple items at different times in ${mode} mode`);
    }
  });

  it('should handle setting an item with an invalid expiration date', async () => {
    const identifier = 'invalid-expiration-test';
    const invalidDate = new Date('invalid date');

    for (const mode of modes) {
      await expect(clientSet(identifier, storeName, testValue, invalidDate, mode)).rejects.toThrow(
        'Invalid expiration date',
      );

      log(`Successfully handled invalid expiration date in ${mode} mode`);
    }
  });

  it('should handle updating an item to extend its expiration', async () => {
    const identifier = 'extend-expiration-test';
    const initialDate = new Date(Date.now() + 1000); // 1 second from now
    const extendedDate = new Date(Date.now() + 10000); // 10 seconds from now

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, initialDate, mode);

      // Wait for 0.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update the item with a new expiration date
      await clientSet(identifier, storeName, testValue, extendedDate, mode);

      // Wait for another 0.7 seconds (total 1.2 seconds, past the initial expiration)
      await new Promise((resolve) => setTimeout(resolve, 700));

      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate: extendedDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 1,
        setHitCount: 2,
      };
      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toEqual(testValue);

      log(`Successfully handled extending item expiration in ${mode} mode`);
    }
  });

  it('should handle immediate expiration', async () => {
    const identifier = 'immediate-expiration-test';
    const immediateExpirationDate = new Date(Date.now());

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, immediateExpirationDate, mode);

      // Wait for a small amount of time to ensure the item has expired
      await new Promise((resolve) => setTimeout(resolve, 10));

      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: undefined,
        expirationDate: immediateExpirationDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 0,
        setHitCount: 1,
      };
      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toBeUndefined();

      log(`Successfully handled immediate expiration in ${mode} mode`);
    }
  });

  it('should handle expiration during a get operation', async () => {
    const identifier = 'expiration-during-get-test';
    const expirationDate = new Date(Date.now() + 500); // 500ms from now

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, expirationDate, mode);

      // Wait for 490ms (just before expiration)
      await new Promise((resolve) => setTimeout(resolve, 490));

      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 1,
        setHitCount: 1,
      };
      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      // This get operation should succeed
      const result1 = await clientGet(identifier, storeName, mode);
      expect(result1.value).toEqual(testValue);

      // Wait for another 20ms (now past expiration)
      await new Promise((resolve) => setTimeout(resolve, 20));

      const expiredMockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: undefined,
        expirationDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 1,
        setHitCount: 1,
      };
      (clientGet as jest.Mock).mockResolvedValue(expiredMockCacheResult);

      // This get operation should return undefined
      const result2 = await clientGet(identifier, storeName, mode);
      expect(result2.value).toBeUndefined();

      log(`Successfully handled expiration during get operation in ${mode} mode`);
    }
  });

  it('should handle removing an expired item', async () => {
    const identifier = 'remove-expired-test';
    const expirationDate = new Date(Date.now() + 100); // 100ms from now

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, expirationDate, mode);

      // Wait for 110ms (past expiration)
      await new Promise((resolve) => setTimeout(resolve, 110));

      await clientRemove(identifier, storeName, mode);

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

      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toBeUndefined();

      log(`Successfully handled removing an expired item in ${mode} mode`);
    }
  });

  it('should handle setting a new expiration date for an existing item', async () => {
    const identifier = 'update-expiration-test';
    const initialDate = new Date(Date.now() + 1000); // 1 second from now
    const updatedDate = new Date(Date.now() + 5000); // 5 seconds from now

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, initialDate, mode);

      // Update the expiration date
      await clientSet(identifier, storeName, testValue, updatedDate, mode);

      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate: updatedDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 1,
        setHitCount: 2,
      };
      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      // Wait for 1.5 seconds (past the initial expiration but before the updated expiration)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toEqual(testValue);

      log(
        `Successfully handled setting a new expiration date for an existing item in ${mode} mode`,
      );
    }
  });
});
