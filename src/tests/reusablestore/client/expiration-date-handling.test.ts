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

  it('should handle setting an item with a future expiration date', async () => {
    const identifier = 'future-expiration-test';
    const futureDate = new Date(Date.now() + 3600000); // 1 hour in the future

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, futureDate, mode);

      expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, futureDate, mode);

      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate: futureDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 1,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(identifier, storeName, mode);
      expect(result).toEqual(mockCacheResult);

      log(`Successfully handled future expiration date in ${mode} mode`);
    }
  });

  it('should handle setting an item with an immediate expiration date', async () => {
    const identifier = 'immediate-expiration-test';
    const immediateDate = new Date();

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, immediateDate, mode);

      expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, immediateDate, mode);

      // Simulate a small delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: undefined,
        expirationDate: immediateDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 0,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toBeUndefined();

      log(`Successfully handled immediate expiration date in ${mode} mode`);
    }
  });

  it('should handle setting an item with a past expiration date', async () => {
    const identifier = 'past-expiration-test';
    const pastDate = new Date(Date.now() - 3600000); // 1 hour in the past

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, pastDate, mode);

      expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, pastDate, mode);

      const mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: undefined,
        expirationDate: pastDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 0,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toBeUndefined();

      log(`Successfully handled past expiration date in ${mode} mode`);
    }
  });

  it('should handle updating an item with a new expiration date', async () => {
    const identifier = 'update-expiration-test';
    const initialDate = new Date(Date.now() + 1800000); // 30 minutes in the future
    const updatedDate = new Date(Date.now() + 3600000); // 1 hour in the future

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, initialDate, mode);
      await clientSet(identifier, storeName, testValue, updatedDate, mode);

      expect(clientSet).toHaveBeenCalledTimes(2);
      expect(clientSet).toHaveBeenLastCalledWith(
        identifier,
        storeName,
        testValue,
        updatedDate,
        mode,
      );

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

      const result = await clientGet(identifier, storeName, mode);
      expect(result).toEqual(mockCacheResult);

      log(`Successfully handled updating expiration date in ${mode} mode`);
    }
  });

  it('should handle removing an item before its expiration date', async () => {
    const identifier = 'remove-before-expiration-test';
    const futureDate = new Date(Date.now() + 3600000); // 1 hour in the future

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, futureDate, mode);
      await clientRemove(identifier, storeName, mode);

      expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, futureDate, mode);
      expect(clientRemove).toHaveBeenCalledWith(identifier, storeName, mode);

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

      log(`Successfully handled removing item before expiration in ${mode} mode`);
    }
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

  it('should handle multiple items with different expiration dates', async () => {
    const identifiers = ['multi-exp-1', 'multi-exp-2', 'multi-exp-3'];
    const expirationDates = [
      new Date(Date.now() + 1800000), // 30 minutes in the future
      new Date(Date.now() + 3600000), // 1 hour in the future
      new Date(Date.now() + 7200000), // 2 hours in the future
    ];

    for (const mode of modes) {
      for (let i = 0; i < identifiers.length; i++) {
        await clientSet(identifiers[i], storeName, testValue, expirationDates[i], mode);
        expect(clientSet).toHaveBeenCalledWith(
          identifiers[i],
          storeName,
          testValue,
          expirationDates[i],
          mode,
        );
      }

      // Simulate a delay of 45 minutes
      const futureDate = new Date(Date.now() + 2700000);
      jest.useFakeTimers().setSystemTime(futureDate);

      for (let i = 0; i < identifiers.length; i++) {
        const mockCacheResult: CacheResult = {
          identifier: identifiers[i],
          storeName,
          value: i === 0 ? undefined : testValue,
          expirationDate: expirationDates[i],
          lastUpdatedDate: expect.any(Date),
          lastAccessedDate: expect.any(Date),
          getHitCount: i === 0 ? 0 : 1,
          setHitCount: 1,
        };

        (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

        const result = await clientGet(identifiers[i], storeName, mode);
        expect(result).toEqual(mockCacheResult);
      }

      jest.useRealTimers();

      log(`Successfully handled multiple items with different expiration dates in ${mode} mode`);
    }
  });

  it('should handle expiration date changes', async () => {
    const identifier = 'expiration-change-test';
    const initialDate = new Date(Date.now() + 1800000); // 30 minutes in the future
    const updatedDate = new Date(Date.now() + 3600000); // 1 hour in the future

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, initialDate, mode);
      expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, initialDate, mode);

      let mockCacheResult: CacheResult = {
        identifier,
        storeName,
        value: testValue,
        expirationDate: initialDate,
        lastUpdatedDate: expect.any(Date),
        lastAccessedDate: expect.any(Date),
        getHitCount: 1,
        setHitCount: 1,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      let result = await clientGet(identifier, storeName, mode);
      expect(result).toEqual(mockCacheResult);

      // Update expiration date
      await clientSet(identifier, storeName, testValue, updatedDate, mode);
      expect(clientSet).toHaveBeenCalledWith(identifier, storeName, testValue, updatedDate, mode);

      mockCacheResult = {
        ...mockCacheResult,
        expirationDate: updatedDate,
        setHitCount: 2,
      };

      (clientGet as jest.Mock).mockResolvedValue(mockCacheResult);

      result = await clientGet(identifier, storeName, mode);
      expect(result).toEqual(mockCacheResult);

      log(`Successfully handled expiration date changes in ${mode} mode`);
    }
  });
});
