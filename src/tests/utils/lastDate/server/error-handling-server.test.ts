import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('error-handling-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Error Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Error Handling tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = jest.fn(async (key: string): Promise<string | null> => mockStorage[key] || null);
    mockSet = jest.fn(async (key: string, value: string): Promise<void> => {
      mockStorage[key] = value;
    });
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle get operation failures for getLastUpdatedDate', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    mockGet.mockRejectedValueOnce(new Error('Database connection failed'));

    await expect(getLastUpdatedDate(mockGet, identifier, storeName)).rejects.toThrow(
      'Database connection failed',
    );
    log('Successfully caught error in getLastUpdatedDate');
  });

  it('should handle set operation failures for updateLastAccessedDate', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date();
    mockSet.mockRejectedValueOnce(new Error('Write operation failed'));

    await expect(updateLastAccessedDate(mockSet, identifier, storeName, date)).rejects.toThrow(
      'Write operation failed',
    );
    log('Successfully caught error in updateLastAccessedDate');
  });

  it('should handle invalid date input for updateLastUpdatedDate', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const invalidDate = new Date('invalid date');

    await updateLastUpdatedDate(mockSet, identifier, storeName, invalidDate);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved date after invalid input: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle null values returned by get operation for getLastAccessedDate', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    mockGet.mockResolvedValueOnce(null);

    const result = await getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved date for null value: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle undefined values for updateLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';

    await updateLastDates(mockSet, identifier, storeName, {});
    const result = await getLastDates(mockGet, identifier, storeName);
    log(`Retrieved dates after update with undefined values:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(new Date(0).getTime());
  });

  it('should handle get operation timeout for getLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    mockGet.mockImplementationOnce(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Operation timed out')), 1000),
        ),
    );

    await expect(getLastDates(mockGet, identifier, storeName)).rejects.toThrow(
      'Operation timed out',
    );
    log('Successfully caught timeout error in getLastDates');
  });

  it('should handle set operation with invalid key for updateLastUpdatedDate', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date();
    mockSet.mockRejectedValueOnce(new Error('Invalid key'));

    await expect(updateLastUpdatedDate(mockSet, identifier, storeName, date)).rejects.toThrow(
      'Invalid key',
    );
    log('Successfully caught invalid key error in updateLastUpdatedDate');
  });

  it('should handle concurrent errors for updateLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date();
    mockSet.mockRejectedValueOnce(new Error('Concurrent modification error'));

    await expect(
      updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      }),
    ).rejects.toThrow('Concurrent modification error');
    log('Successfully caught concurrent modification error in updateLastDates');
  });

  it('should handle malformed date strings returned by get operation', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    mockGet.mockResolvedValueOnce('not a date');

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved date for malformed date string: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle errors when updating both dates in updateLastDates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date();
    mockSet
      .mockRejectedValueOnce(new Error('First update failed'))
      .mockRejectedValueOnce(new Error('Second update failed'));

    await expect(
      updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      }),
    ).rejects.toThrow('First update failed');
    log('Successfully caught error when updating both dates in updateLastDates');
  });

  it('should handle errors with non-string identifiers or store names', async () => {
    const identifier = 123 as unknown as string; // Simulating a type error
    const storeName = { name: 'store' } as unknown as string; // Simulating a type error
    const date = new Date();

    await expect(updateLastUpdatedDate(mockSet, identifier, storeName, date)).rejects.toThrow();
    log('Successfully caught error with non-string identifiers or store names');
  });
});
