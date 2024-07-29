import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('empty-identifier-and-store-name-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Empty Identifier and Store Name Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Empty Identifier and Store Name Handling tests...');
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

  it('should handle empty identifier for getLastUpdatedDate', async () => {
    const identifier = '';
    const storeName = 'testStore';

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Retrieved last updated date with empty identifier: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle empty store name for getLastAccessedDate', async () => {
    const identifier = 'testId';
    const storeName = '';

    const result = await getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved last accessed date with empty store name: ${result.toISOString()}`);
    expect(result).toEqual(new Date(0));
  });

  it('should handle empty identifier and store name for updateLastUpdatedDate', async () => {
    const identifier = '';
    const storeName = '';
    const date = new Date();

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);
    log(
      `Retrieved last updated date after update with empty identifier and store name: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle empty identifier for updateLastAccessedDate', async () => {
    const identifier = '';
    const storeName = 'testStore';
    const date = new Date();

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);
    log(`Retrieved last accessed date after update with empty identifier: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle empty store name for getLastDates', async () => {
    const identifier = 'testId';
    const storeName = '';

    const result = await getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last dates with empty store name:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle empty identifier and store name for updateLastDates', async () => {
    const identifier = '';
    const storeName = '';
    const updatedDate = new Date('2023-06-15T10:00:00.000Z');
    const accessedDate = new Date('2023-06-15T11:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });
    const result = await getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last dates after update with empty identifier and store name:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle empty identifier for updateLastDates with only lastUpdatedDate', async () => {
    const identifier = '';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-16T10:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastUpdatedDate: updatedDate });
    const result = await getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last dates after update with empty identifier and only lastUpdatedDate:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(updatedDate);
    expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(updatedDate.getTime());
  });

  it('should handle empty store name for updateLastDates with only lastAccessedDate', async () => {
    const identifier = 'testId';
    const storeName = '';
    const accessedDate = new Date('2023-06-17T11:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, { lastAccessedDate: accessedDate });
    const result = await getLastDates(mockGet, identifier, storeName);
    log(`Retrieved last dates after update with empty store name and only lastAccessedDate:`);
    log(`Last updated date: ${result.lastUpdatedDate.toISOString()}`);
    log(`Last accessed date: ${result.lastAccessedDate.toISOString()}`);
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle completely empty strings for all parameters', async () => {
    const identifier = '';
    const storeName = '';
    const date = new Date('2023-06-18T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    await updateLastAccessedDate(mockSet, identifier, storeName, date);

    const updatedDate = await getLastUpdatedDate(mockGet, identifier, storeName);
    const accessedDate = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved dates with completely empty strings for all parameters:`);
    log(`Last updated date: ${updatedDate.toISOString()}`);
    log(`Last accessed date: ${accessedDate.toISOString()}`);
    expect(updatedDate).toEqual(date);
    expect(accessedDate).toEqual(date);
  });
});
