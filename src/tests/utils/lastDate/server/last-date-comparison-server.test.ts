import {
  getLastUpdatedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('last-date-comparison-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Date Comparison', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Date Comparison tests...');
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

  it('should correctly compare last updated and last accessed dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-15T10:00:00.000Z');
    const accessedDate = new Date('2023-06-15T11:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate).toEqual(accessedDate);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(result.lastUpdatedDate.getTime());
  });

  it('should handle equal last updated and last accessed dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-16T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(result.lastAccessedDate);
  });

  it('should correctly update last accessed date to be later than last updated date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-17T10:00:00.000Z');
    const accessedDate = new Date('2023-06-17T11:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, updatedDate);
    await updateLastAccessedDate(mockSet, identifier, storeName, accessedDate);

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate).toEqual(accessedDate);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThan(result.lastUpdatedDate.getTime());
  });

  it('should handle updating last updated date to be later than last accessed date', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const initialAccessedDate = new Date('2023-06-18T10:00:00.000Z');
    const laterUpdatedDate = new Date('2023-06-18T11:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, initialAccessedDate);
    await updateLastUpdatedDate(mockSet, identifier, storeName, laterUpdatedDate);

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(laterUpdatedDate);
    expect(result.lastAccessedDate).toEqual(initialAccessedDate);
    expect(result.lastUpdatedDate.getTime()).toBeGreaterThan(result.lastAccessedDate.getTime());
  });

  it('should compare dates with millisecond precision', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-19T12:00:00.123Z');
    const accessedDate = new Date('2023-06-19T12:00:00.124Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate).toEqual(accessedDate);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle comparing dates across day boundaries', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-19T23:59:59.999Z');
    const accessedDate = new Date('2023-06-20T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate).toEqual(accessedDate);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should compare dates correctly when only one date is updated', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-21T10:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, updatedDate);
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(
      result.lastUpdatedDate.getTime(),
    );
  });

  it('should handle comparison of dates in different time zones', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-22T10:00:00+02:00');
    const accessedDate = new Date('2023-06-22T09:00:00Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate.getTime()).toBe(updatedDate.getTime());
    expect(result.lastAccessedDate.getTime()).toBe(accessedDate.getTime());
    expect(result.lastUpdatedDate.getTime()).toBe(result.lastAccessedDate.getTime());
  });

  it('should correctly compare dates when updated in quick succession', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const baseDate = new Date('2023-06-23T12:00:00.000Z');

    for (let i = 0; i < 10; i++) {
      const date = new Date(baseDate.getTime() + i);
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    }

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Final last updated date: ${result.toISOString()}`);
    expect(result.getTime()).toBe(baseDate.getTime() + 9);
  });

  it('should handle comparison of very old dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const oldUpdatedDate = new Date('1970-01-01T00:00:00.001Z');
    const oldAccessedDate = new Date('1970-01-01T00:00:00.002Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: oldUpdatedDate,
      lastAccessedDate: oldAccessedDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(oldUpdatedDate);
    expect(result.lastAccessedDate).toEqual(oldAccessedDate);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should handle comparison of dates in the far future', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const futureUpdatedDate = new Date('2100-01-01T00:00:00.000Z');
    const futureAccessedDate = new Date('2100-01-01T00:00:00.001Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: futureUpdatedDate,
      lastAccessedDate: futureAccessedDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(futureUpdatedDate);
    expect(result.lastAccessedDate).toEqual(futureAccessedDate);
    expect(result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime()).toBe(1);
  });

  it('should correctly compare dates when updated and accessed simultaneously', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const simultaneousDate = new Date();

    await Promise.all([
      updateLastUpdatedDate(mockSet, identifier, storeName, simultaneousDate),
      updateLastAccessedDate(mockSet, identifier, storeName, simultaneousDate),
    ]);

    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate.getTime()).toBeLessThanOrEqual(result.lastAccessedDate.getTime());
    expect(
      result.lastAccessedDate.getTime() - result.lastUpdatedDate.getTime(),
    ).toBeLessThanOrEqual(1);
  });

  it('should handle comparison when dates are reset to epoch', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const epochDate = new Date(0);

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: epochDate,
      lastAccessedDate: epochDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(epochDate);
    expect(result.lastAccessedDate).toEqual(epochDate);
    expect(result.lastUpdatedDate.getTime()).toBe(result.lastAccessedDate.getTime());
  });
});
