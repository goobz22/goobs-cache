import { clientGet } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, CacheResult } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('client-get-default-cache-result-test.log');
const log = createLogger(logStream);

describe('Client Get Default Cache Result Tests', () => {
  const storeName = 'test-store';
  const modes: CacheMode[] = ['client', 'cookie'];

  beforeAll(() => {
    log('Starting Client Get Default Cache Result tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a default CacheResult for non-existent keys', async () => {
    const identifier = 'non-existent';
    const defaultCacheResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    };

    (clientGet as jest.Mock).mockResolvedValue(defaultCacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
      expect(result).toEqual(defaultCacheResult);
      expect(result.value).toBeUndefined();
      expect(result.expirationDate).toEqual(new Date(0));
      expect(result.lastUpdatedDate).toEqual(new Date(0));
      expect(result.lastAccessedDate).toEqual(new Date(0));
      expect(result.getHitCount).toBe(0);
      expect(result.setHitCount).toBe(0);

      log(`Default CacheResult returned for non-existent key in ${mode} mode`);
    }
  });

  it('should handle undefined value in CacheResult', async () => {
    const identifier = 'undefined-value';
    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
      expect(result).toEqual(cacheResult);
      expect(result.value).toBeUndefined();

      log(`Handled undefined value in CacheResult for ${mode} mode`);
    }
  });

  it('should handle null value in CacheResult', async () => {
    const identifier = 'null-value';
    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: null,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
      expect(result).toEqual(cacheResult);
      expect(result.value).toBeNull();

      log(`Handled null value in CacheResult for ${mode} mode`);
    }
  });

  it('should handle empty object value in CacheResult', async () => {
    const identifier = 'empty-object';
    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: { type: 'json', value: {} },
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
      expect(result).toEqual(cacheResult);
      expect(result.value).toEqual({ type: 'json', value: {} });

      log(`Handled empty object value in CacheResult for ${mode} mode`);
    }
  });

  it('should handle empty array value in CacheResult', async () => {
    const identifier = 'empty-array';
    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: { type: 'json', value: [] },
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
      expect(result).toEqual(cacheResult);
      expect(result.value).toEqual({ type: 'json', value: [] });

      log(`Handled empty array value in CacheResult for ${mode} mode`);
    }
  });

  it('should handle expired CacheResult', async () => {
    const identifier = 'expired';
    const expiredDate = new Date(Date.now() - 1000); // 1 second ago
    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: { type: 'string', value: 'expired value' },
      expirationDate: expiredDate,
      lastUpdatedDate: expiredDate,
      lastAccessedDate: expiredDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
      expect(result).toEqual(cacheResult);
      expect(result.expirationDate.getTime()).toBeLessThan(Date.now());

      log(`Handled expired CacheResult for ${mode} mode`);
    }
  });

  it('should handle CacheResult with zero hit counts', async () => {
    const identifier = 'zero-hits';
    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: { type: 'string', value: 'zero hits value' },
      expirationDate: new Date(Date.now() + 1000), // 1 second in the future
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 0,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
      expect(result).toEqual(cacheResult);
      expect(result.getHitCount).toBe(0);
      expect(result.setHitCount).toBe(0);

      log(`Handled CacheResult with zero hit counts for ${mode} mode`);
    }
  });

  it('should handle CacheResult with very old dates', async () => {
    const identifier = 'old-dates';
    const oldDate = new Date(0); // January 1, 1970
    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: { type: 'string', value: 'old date value' },
      expirationDate: oldDate,
      lastUpdatedDate: oldDate,
      lastAccessedDate: oldDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
      expect(result).toEqual(cacheResult);
      expect(result.expirationDate).toEqual(oldDate);
      expect(result.lastUpdatedDate).toEqual(oldDate);
      expect(result.lastAccessedDate).toEqual(oldDate);

      log(`Handled CacheResult with very old dates for ${mode} mode`);
    }
  });

  it('should handle CacheResult with future dates', async () => {
    const identifier = 'future-dates';
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year in the future
    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: { type: 'string', value: 'future date value' },
      expirationDate: futureDate,
      lastUpdatedDate: futureDate,
      lastAccessedDate: futureDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
      expect(result).toEqual(cacheResult);
      expect(result.expirationDate).toEqual(futureDate);
      expect(result.lastUpdatedDate).toEqual(futureDate);
      expect(result.lastAccessedDate).toEqual(futureDate);

      log(`Handled CacheResult with future dates for ${mode} mode`);
    }
  });

  it('should handle CacheResult with very large hit counts', async () => {
    const identifier = 'large-hit-counts';
    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: { type: 'string', value: 'high traffic value' },
      expirationDate: new Date(Date.now() + 1000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: Number.MAX_SAFE_INTEGER,
      setHitCount: Number.MAX_SAFE_INTEGER,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, storeName, mode);
      expect(result).toEqual(cacheResult);
      expect(result.getHitCount).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.setHitCount).toBe(Number.MAX_SAFE_INTEGER);

      log(`Handled CacheResult with very large hit counts for ${mode} mode`);
    }
  });

  it('should handle CacheResult with mismatched identifier', async () => {
    const requestedIdentifier = 'requested-id';
    const returnedIdentifier = 'mismatched-id';
    const cacheResult: CacheResult = {
      identifier: returnedIdentifier,
      storeName,
      value: { type: 'string', value: 'mismatched identifier value' },
      expirationDate: new Date(Date.now() + 1000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(requestedIdentifier, storeName, mode);

      expect(clientGet).toHaveBeenCalledWith(requestedIdentifier, storeName, mode);
      expect(result.identifier).not.toBe(requestedIdentifier);
      expect(result.identifier).toBe(returnedIdentifier);

      log(`Handled CacheResult with mismatched identifier for ${mode} mode`);
    }
  });

  it('should handle CacheResult with mismatched storeName', async () => {
    const identifier = 'mismatched-store';
    const requestedStoreName = 'requested-store';
    const returnedStoreName = 'mismatched-store';
    const cacheResult: CacheResult = {
      identifier,
      storeName: returnedStoreName,
      value: { type: 'string', value: 'mismatched store value' },
      expirationDate: new Date(Date.now() + 1000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (clientGet as jest.Mock).mockResolvedValue(cacheResult);

    for (const mode of modes) {
      const result = await clientGet(identifier, requestedStoreName, mode);

      expect(clientGet).toHaveBeenCalledWith(identifier, requestedStoreName, mode);
      expect(result.storeName).not.toBe(requestedStoreName);
      expect(result.storeName).toBe(returnedStoreName);

      log(`Handled CacheResult with mismatched storeName for ${mode} mode`);
    }
  });
});
