import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('concurrent-operations-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Concurrent Operations', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Concurrent Operations tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = (key: string): string | null => mockStorage[key] || null;
    mockSet = (key: string, value: string): void => {
      mockStorage[key] = value;
    };
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle concurrent updates to last updated date', async () => {
    log('\nTesting concurrent updates to last updated date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const concurrentOperations = 100;

    const updatePromises = Array(concurrentOperations)
      .fill(null)
      .map(() => Promise.resolve(updateLastUpdatedDate(mockSet, identifier, storeName)));

    await Promise.all(updatePromises);

    const lastUpdatedDate = getLastUpdatedDate(mockGet, identifier, storeName);
    log(`Final last updated date: ${lastUpdatedDate.toISOString()}`);

    expect(lastUpdatedDate).toBeDefined();
  });

  it('should handle concurrent updates to last accessed date', async () => {
    log('\nTesting concurrent updates to last accessed date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const concurrentOperations = 100;

    const updatePromises = Array(concurrentOperations)
      .fill(null)
      .map(() => Promise.resolve(updateLastAccessedDate(mockSet, identifier, storeName)));

    await Promise.all(updatePromises);

    const lastAccessedDate = getLastAccessedDate(mockGet, identifier, storeName);
    log(`Final last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastAccessedDate).toBeDefined();
  });

  it('should handle concurrent updates to both last updated and accessed dates', async () => {
    log('\nTesting concurrent updates to both last updated and accessed dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const concurrentOperations = 50;

    const updatePromises = Array(concurrentOperations)
      .fill(null)
      .flatMap(() => [
        Promise.resolve(updateLastUpdatedDate(mockSet, identifier, storeName)),
        Promise.resolve(updateLastAccessedDate(mockSet, identifier, storeName)),
      ]);

    await Promise.all(updatePromises);

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
    log(`Final last updated date: ${lastUpdatedDate.toISOString()}`);
    log(`Final last accessed date: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toBeDefined();
    expect(lastAccessedDate).toBeDefined();
  });

  it('should handle concurrent operations on multiple identifiers', async () => {
    log('\nTesting concurrent operations on multiple identifiers...');

    const concurrentOperations = 50;
    const identifiers = ['id1', 'id2', 'id3', 'id4', 'id5'];
    const storeName = 'testStore';

    const updatePromises = Array(concurrentOperations)
      .fill(null)
      .flatMap(() =>
        identifiers.map((id) =>
          Promise.resolve(
            updateLastDates(mockSet, id, storeName, {
              lastUpdatedDate: new Date(),
              lastAccessedDate: new Date(),
            }),
          ),
        ),
      );

    await Promise.all(updatePromises);

    for (const id of identifiers) {
      const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, id, storeName);
      log(
        `Final dates for ${id} - Last Updated: ${lastUpdatedDate.toISOString()}, Last Accessed: ${lastAccessedDate.toISOString()}`,
      );

      expect(lastUpdatedDate).toBeDefined();
      expect(lastAccessedDate).toBeDefined();
    }
  });

  it('should handle concurrent operations on multiple store names', async () => {
    log('\nTesting concurrent operations on multiple store names...');

    const concurrentOperations = 50;
    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3', 'store4', 'store5'];

    const updatePromises = Array(concurrentOperations)
      .fill(null)
      .flatMap(() =>
        storeNames.map((storeName) =>
          Promise.resolve(
            updateLastDates(mockSet, identifier, storeName, {
              lastUpdatedDate: new Date(),
              lastAccessedDate: new Date(),
            }),
          ),
        ),
      );

    await Promise.all(updatePromises);

    for (const storeName of storeNames) {
      const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, storeName);
      log(
        `Final dates for ${storeName} - Last Updated: ${lastUpdatedDate.toISOString()}, Last Accessed: ${lastAccessedDate.toISOString()}`,
      );

      expect(lastUpdatedDate).toBeDefined();
      expect(lastAccessedDate).toBeDefined();
    }
  });
});
