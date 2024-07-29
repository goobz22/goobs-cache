import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('date-format-handling-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Date Format Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Date Format Handling tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = async (key: string): Promise<string | null> => mockStorage[key] || null;
    mockSet = async (key: string, value: string): Promise<void> => {
      mockStorage[key] = value;
    };
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle ISO 8601 date format', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved ISO 8601 formatted date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should handle date-only format', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-16');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date-only formatted date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.toDateString()).toEqual(date.toDateString());
  });

  it('should handle time-only format', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30);

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved time-only formatted date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.getHours()).toEqual(14);
    expect(retrievedDate.getMinutes()).toEqual(30);
  });

  it('should handle different timezone offsets', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-17T10:00:00+02:00');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const retrievedDates = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved date with timezone offset (updated): ${retrievedDates.lastUpdatedDate.toISOString()}`,
    );
    log(
      `Retrieved date with timezone offset (accessed): ${retrievedDates.lastAccessedDate.toISOString()}`,
    );
    expect(retrievedDates.lastUpdatedDate.getUTCHours()).toEqual(8);
    expect(retrievedDates.lastAccessedDate.getUTCHours()).toEqual(8);
  });

  it('should handle millisecond precision', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-18T12:34:56.789Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date with millisecond precision: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.getMilliseconds()).toEqual(789);
  });

  it('should handle leap year dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2024-02-29T00:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved leap year date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.getUTCFullYear()).toEqual(2024);
    expect(retrievedDate.getUTCMonth()).toEqual(1);
    expect(retrievedDate.getUTCDate()).toEqual(29);
  });

  it('should handle dates before 1970 (Unix epoch)', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('1969-12-31T23:59:59.999Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved pre-1970 date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should handle far future dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2100-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const retrievedDates = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved far future date (updated): ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved far future date (accessed): ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(date);
    expect(retrievedDates.lastAccessedDate).toEqual(date);
  });

  it('should handle daylight saving time transitions', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    // Note: This date is during DST for many time zones
    const dstDate = new Date('2023-07-01T12:00:00.000Z');
    // Note: This date is typically not during DST
    const nonDstDate = new Date('2023-01-01T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, dstDate);
    await updateLastAccessedDate(mockSet, identifier, storeName, nonDstDate);

    const retrievedDates = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved DST date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved non-DST date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(dstDate);
    expect(retrievedDates.lastAccessedDate).toEqual(nonDstDate);
  });

  it('should handle date format with no time component', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-20');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date with no time component: ${retrievedDate.toISOString()}`);
    expect(retrievedDate.getUTCHours()).toEqual(0);
    expect(retrievedDate.getUTCMinutes()).toEqual(0);
    expect(retrievedDate.getUTCSeconds()).toEqual(0);
    expect(retrievedDate.getUTCMilliseconds()).toEqual(0);
  });

  it('should handle date crossing month boundaries', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const startDate = new Date('2023-07-31T23:59:59.999Z');
    const endDate = new Date('2023-08-01T00:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, startDate);
    await updateLastAccessedDate(mockSet, identifier, storeName, endDate);

    const retrievedDates = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved start date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved end date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(startDate);
    expect(retrievedDates.lastAccessedDate).toEqual(endDate);
    expect(
      retrievedDates.lastAccessedDate.getTime() - retrievedDates.lastUpdatedDate.getTime(),
    ).toEqual(1);
  });

  it('should handle date crossing year boundaries', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const startDate = new Date('2023-12-31T23:59:59.999Z');
    const endDate = new Date('2024-01-01T00:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: startDate,
      lastAccessedDate: endDate,
    });
    const retrievedDates = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved start date: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved end date: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(startDate);
    expect(retrievedDates.lastAccessedDate).toEqual(endDate);
    expect(
      retrievedDates.lastAccessedDate.getTime() - retrievedDates.lastUpdatedDate.getTime(),
    ).toEqual(1);
  });

  it('should handle RFC 2822 formatted dates', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('Wed, 21 Oct 2015 07:28:00 GMT');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved RFC 2822 formatted date: ${retrievedDate.toISOString()}`);
    expect(retrievedDate).toEqual(date);
  });

  it('should handle dates with different locales', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-21T15:30:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const retrievedDate = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date (ISO): ${retrievedDate.toISOString()}`);
    log(`Retrieved date (en-US): ${retrievedDate.toLocaleString('en-US')}`);
    log(`Retrieved date (de-DE): ${retrievedDate.toLocaleString('de-DE')}`);
    log(`Retrieved date (ja-JP): ${retrievedDate.toLocaleString('ja-JP')}`);

    expect(retrievedDate).toEqual(date);
  });

  it('should handle very precise time differences', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const date1 = new Date('2023-06-22T10:30:00.123Z');
    const date2 = new Date('2023-06-22T10:30:00.124Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date1);
    await updateLastAccessedDate(mockSet, identifier, storeName, date2);

    const retrievedDates = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved date1: ${retrievedDates.lastUpdatedDate.toISOString()}`);
    log(`Retrieved date2: ${retrievedDates.lastAccessedDate.toISOString()}`);
    expect(retrievedDates.lastUpdatedDate).toEqual(date1);
    expect(retrievedDates.lastAccessedDate).toEqual(date2);
    expect(
      retrievedDates.lastAccessedDate.getTime() - retrievedDates.lastUpdatedDate.getTime(),
    ).toEqual(1);
  });
});
