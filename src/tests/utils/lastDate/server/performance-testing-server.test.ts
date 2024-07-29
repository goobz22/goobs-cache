import {
  getLastUpdatedDate,
  updateLastUpdatedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('performance-testing-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Performance Testing', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Performance tests...');
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

  it('should handle a large number of sequential updates efficiently', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const iterations = 10000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const date = new Date(startTime + i);
      await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    log(`Completed ${iterations} sequential updates in ${duration}ms`);
    expect(duration).toBeLessThan(5000); // Assuming less than 5 seconds is acceptable

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result).toEqual(new Date(startTime + iterations - 1));
  });

  it('should handle a large number of concurrent updates efficiently', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const iterations = 10000;
    const startTime = Date.now();

    const updatePromises = Array.from({ length: iterations }, (_, i) => {
      const date = new Date(startTime + i);
      return updateLastUpdatedDate(mockSet, identifier, storeName, date);
    });

    await Promise.all(updatePromises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    log(`Completed ${iterations} concurrent updates in ${duration}ms`);
    expect(duration).toBeLessThan(2000); // Assuming less than 2 seconds is acceptable

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result.getTime()).toBeGreaterThanOrEqual(startTime);
    expect(result.getTime()).toBeLessThanOrEqual(startTime + iterations - 1);
  });

  it('should handle rapid alternating reads and writes efficiently', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const iterations = 10000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      if (i % 2 === 0) {
        const date = new Date(startTime + i);
        await updateLastUpdatedDate(mockSet, identifier, storeName, date);
      } else {
        await getLastUpdatedDate(mockGet, identifier, storeName);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    log(`Completed ${iterations} alternating operations in ${duration}ms`);
    expect(duration).toBeLessThan(5000); // Assuming less than 5 seconds is acceptable

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result.getTime()).toBeGreaterThanOrEqual(startTime);
    expect(result.getTime()).toBeLessThanOrEqual(startTime + iterations - 1);
  });

  it('should handle multiple identifiers and store names efficiently', async () => {
    const iterations = 1000;
    const identifiers = 10;
    const storeNames = 10;
    const startTime = Date.now();

    const updatePromises = Array.from({ length: iterations }, (_, i) => {
      const identifier = `testId${i % identifiers}`;
      const storeName = `testStore${i % storeNames}`;
      const date = new Date(startTime + i);
      return updateLastDates(mockSet, identifier, storeName, {
        lastUpdatedDate: date,
        lastAccessedDate: date,
      });
    });

    await Promise.all(updatePromises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    log(`Completed ${iterations} multi-identifier/store updates in ${duration}ms`);
    expect(duration).toBeLessThan(2000); // Assuming less than 2 seconds is acceptable

    // Verify a random subset
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * iterations);
      const identifier = `testId${randomIndex % identifiers}`;
      const storeName = `testStore${randomIndex % storeNames}`;
      const result = await getLastDates(mockGet, identifier, storeName);
      expect(result.lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(startTime);
      expect(result.lastUpdatedDate.getTime()).toBeLessThanOrEqual(startTime + iterations - 1);
      expect(result.lastAccessedDate.getTime()).toBeGreaterThanOrEqual(startTime);
      expect(result.lastAccessedDate.getTime()).toBeLessThanOrEqual(startTime + iterations - 1);
    }
  });

  it('should handle large date ranges efficiently', async () => {
    const identifier = 'testId';
    const storeName = 'testStore';
    const iterations = 10000;
    const startDate = new Date('1970-01-01T00:00:00.000Z');
    const endDate = new Date('2070-01-01T00:00:00.000Z');
    const timeRange = endDate.getTime() - startDate.getTime();
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const randomTime = startDate.getTime() + Math.random() * timeRange;
      const randomDate = new Date(randomTime);
      await updateLastUpdatedDate(mockSet, identifier, storeName, randomDate);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    log(`Completed ${iterations} updates with large date range in ${duration}ms`);
    expect(duration).toBeLessThan(5000); // Assuming less than 5 seconds is acceptable

    const result = await getLastUpdatedDate(mockGet, identifier, storeName);
    expect(result.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
    expect(result.getTime()).toBeLessThanOrEqual(endDate.getTime());
  });
});
