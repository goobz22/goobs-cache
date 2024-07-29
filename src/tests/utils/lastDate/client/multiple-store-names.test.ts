import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('multiple-store-names-test.log');
const log = createLogger(logStream);

describe('Last Date Client Utilities - Multiple Store Names', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Last Date Client Utilities Multiple Store Names tests...');
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

  it('should handle multiple store names for last updated date', () => {
    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3'];
    const dates = [
      new Date('2023-06-15T10:30:00.000Z'),
      new Date('2023-06-16T11:30:00.000Z'),
      new Date('2023-06-17T12:30:00.000Z'),
    ];

    storeNames.forEach((store, index) => {
      updateLastUpdatedDate(mockSet, identifier, store, dates[index]);
    });

    storeNames.forEach((store, index) => {
      const retrievedDate = getLastUpdatedDate(mockGet, identifier, store);
      log(`Retrieved last updated date for ${store}: ${retrievedDate.toISOString()}`);
      expect(retrievedDate).toEqual(dates[index]);
    });
  });

  it('should handle multiple store names for last accessed date', () => {
    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3'];
    const dates = [
      new Date('2023-06-18T13:30:00.000Z'),
      new Date('2023-06-19T14:30:00.000Z'),
      new Date('2023-06-20T15:30:00.000Z'),
    ];

    storeNames.forEach((store, index) => {
      updateLastAccessedDate(mockSet, identifier, store, dates[index]);
    });

    storeNames.forEach((store, index) => {
      const retrievedDate = getLastAccessedDate(mockGet, identifier, store);
      log(`Retrieved last accessed date for ${store}: ${retrievedDate.toISOString()}`);
      expect(retrievedDate).toEqual(dates[index]);
    });
  });

  it('should handle multiple store names for both last updated and last accessed dates', () => {
    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3'];
    const updatedDates = [
      new Date('2023-06-21T16:30:00.000Z'),
      new Date('2023-06-22T17:30:00.000Z'),
      new Date('2023-06-23T18:30:00.000Z'),
    ];
    const accessedDates = [
      new Date('2023-06-21T16:35:00.000Z'),
      new Date('2023-06-22T17:35:00.000Z'),
      new Date('2023-06-23T18:35:00.000Z'),
    ];

    storeNames.forEach((store, index) => {
      updateLastDates(mockSet, identifier, store, {
        lastUpdatedDate: updatedDates[index],
        lastAccessedDate: accessedDates[index],
      });
    });

    storeNames.forEach((store, index) => {
      const { lastUpdatedDate, lastAccessedDate } = getLastDates(mockGet, identifier, store);
      log(`Retrieved last updated date for ${store}: ${lastUpdatedDate.toISOString()}`);
      log(`Retrieved last accessed date for ${store}: ${lastAccessedDate.toISOString()}`);
      expect(lastUpdatedDate).toEqual(updatedDates[index]);
      expect(lastAccessedDate).toEqual(accessedDates[index]);
    });
  });

  it('should handle updating specific store names without affecting others', () => {
    const identifier = 'testId';
    const storeNames = ['store1', 'store2', 'store3'];
    const initialDate = new Date('2023-06-24T19:30:00.000Z');
    const updatedDate = new Date('2023-06-25T20:30:00.000Z');

    storeNames.forEach((store) => {
      updateLastUpdatedDate(mockSet, identifier, store, initialDate);
    });

    updateLastUpdatedDate(mockSet, identifier, storeNames[1], updatedDate);

    storeNames.forEach((store, index) => {
      const retrievedDate = getLastUpdatedDate(mockGet, identifier, store);
      log(`Retrieved last updated date for ${store}: ${retrievedDate.toISOString()}`);
      expect(retrievedDate).toEqual(index === 1 ? updatedDate : initialDate);
    });
  });

  it('should handle multiple store names with different identifiers', () => {
    const identifiers = ['id1', 'id2'];
    const storeNames = ['store1', 'store2'];
    const dates = [new Date('2023-06-26T21:30:00.000Z'), new Date('2023-06-27T22:30:00.000Z')];

    identifiers.forEach((id, index) => {
      storeNames.forEach((store) => {
        updateLastUpdatedDate(mockSet, id, store, dates[index]);
      });
    });

    identifiers.forEach((id, idIndex) => {
      storeNames.forEach((store) => {
        const retrievedDate = getLastUpdatedDate(mockGet, id, store);
        log(`Retrieved last updated date for ${id} in ${store}: ${retrievedDate.toISOString()}`);
        expect(retrievedDate).toEqual(dates[idIndex]);
      });
    });
  });
});
