import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('integration-with-cache-system-test.log');
const log = createLogger(logStream);

class MockCacheSystem {
  private storage: { [key: string]: string } = {};

  get(key: string): string | null {
    return this.storage[key] || null;
  }

  set(key: string, value: string): void {
    this.storage[key] = value;
  }

  clear(): void {
    this.storage = {};
  }
}

describe('Last Date Client Utilities - Integration with Cache System', () => {
  let mockCache: MockCacheSystem;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Integration with Cache System tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockCache = new MockCacheSystem();
  });

  afterAll(() => {
    logStream.end();
  });

  it('should integrate with cache system for updating and getting last updated date', () => {
    log('\nTesting integration with cache system for updating and getting last updated date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-15T10:30:00.000Z');

    updateLastUpdatedDate(mockCache.set.bind(mockCache), identifier, storeName, date);

    const lastUpdatedDate = getLastUpdatedDate(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Retrieved last updated date from cache: ${lastUpdatedDate.toISOString()}`);
    expect(lastUpdatedDate).toEqual(date);
  });

  it('should integrate with cache system for updating and getting last accessed date', () => {
    log('\nTesting integration with cache system for updating and getting last accessed date...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const date = new Date('2023-06-16T14:45:00.000Z');

    updateLastAccessedDate(mockCache.set.bind(mockCache), identifier, storeName, date);

    const lastAccessedDate = getLastAccessedDate(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Retrieved last accessed date from cache: ${lastAccessedDate.toISOString()}`);
    expect(lastAccessedDate).toEqual(date);
  });

  it('should integrate with cache system for updating and getting both dates', () => {
    log('\nTesting integration with cache system for updating and getting both dates...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-17T09:15:00.000Z');
    const accessedDate = new Date('2023-06-17T11:30:00.000Z');

    updateLastDates(mockCache.set.bind(mockCache), identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Retrieved last updated date from cache: ${lastUpdatedDate.toISOString()}`);
    log(`Retrieved last accessed date from cache: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(updatedDate);
    expect(lastAccessedDate).toEqual(accessedDate);
  });

  it('should handle cache clearing', () => {
    log('\nTesting last date behavior after cache clearing...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate = new Date('2023-06-18T09:15:00.000Z');
    const accessedDate = new Date('2023-06-18T11:30:00.000Z');

    updateLastDates(mockCache.set.bind(mockCache), identifier, storeName, {
      lastUpdatedDate: updatedDate,
      lastAccessedDate: accessedDate,
    });

    mockCache.clear();

    const { lastUpdatedDate, lastAccessedDate } = getLastDates(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(`Last updated date after cache clear: ${lastUpdatedDate.toISOString()}`);
    log(`Last accessed date after cache clear: ${lastAccessedDate.toISOString()}`);

    expect(lastUpdatedDate).toEqual(new Date(0));
    expect(lastAccessedDate).toEqual(new Date(0));
  });

  it('should handle multiple cache operations', () => {
    log('\nTesting multiple cache operations...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const updatedDate1 = new Date('2023-06-19T09:15:00.000Z');
    const accessedDate1 = new Date('2023-06-19T11:30:00.000Z');
    const updatedDate2 = new Date('2023-06-20T13:45:00.000Z');
    const accessedDate2 = new Date('2023-06-20T15:00:00.000Z');

    updateLastDates(mockCache.set.bind(mockCache), identifier, storeName, {
      lastUpdatedDate: updatedDate1,
      lastAccessedDate: accessedDate1,
    });

    let { lastUpdatedDate, lastAccessedDate } = getLastDates(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    );

    log(
      `Retrieved dates after first update - Last Updated: ${lastUpdatedDate.toISOString()}, Last Accessed: ${lastAccessedDate.toISOString()}`,
    );
    expect(lastUpdatedDate).toEqual(updatedDate1);
    expect(lastAccessedDate).toEqual(accessedDate1);

    updateLastDates(mockCache.set.bind(mockCache), identifier, storeName, {
      lastUpdatedDate: updatedDate2,
      lastAccessedDate: accessedDate2,
    });

    ({ lastUpdatedDate, lastAccessedDate } = getLastDates(
      mockCache.get.bind(mockCache),
      identifier,
      storeName,
    ));

    log(
      `Retrieved dates after second update - Last Updated: ${lastUpdatedDate.toISOString()}, Last Accessed: ${lastAccessedDate.toISOString()}`,
    );
    expect(lastUpdatedDate).toEqual(updatedDate2);
    expect(lastAccessedDate).toEqual(accessedDate2);
  });
});
