import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('performance-testing-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Performance Testing', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Performance Testing...');
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

  const measureExecutionTime = (func: () => void): number => {
    const start = process.hrtime.bigint();
    func();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1e6; // Convert nanoseconds to milliseconds
  };

  it('should perform increment operations quickly', () => {
    log('\nTesting performance of increment operations...');

    const iterations = 100000;
    const identifier = 'testId';
    const storeName = 'testStore';

    const getHitTime = measureExecutionTime(() => {
      for (let i = 0; i < iterations; i++) {
        HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      }
    });

    const setHitTime = measureExecutionTime(() => {
      for (let i = 0; i < iterations; i++) {
        HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
      }
    });

    log(`Time taken for ${iterations} get hit count increments: ${getHitTime.toFixed(2)} ms`);
    log(`Time taken for ${iterations} set hit count increments: ${setHitTime.toFixed(2)} ms`);

    expect(getHitTime).toBeLessThan(1000); // Expecting less than 1 second for 100,000 operations
    expect(setHitTime).toBeLessThan(1000);
  });

  it('should perform get hit counts operations quickly', () => {
    log('\nTesting performance of get hit counts operations...');

    const iterations = 100000;
    const identifier = 'testId';
    const storeName = 'testStore';

    // Pre-populate some hit counts
    HitCountModule.setHitCounts(mockSet, identifier, storeName, 1000, 2000);

    const getHitCountsTime = measureExecutionTime(() => {
      for (let i = 0; i < iterations; i++) {
        HitCountModule.getHitCounts(mockGet, identifier, storeName);
      }
    });

    log(
      `Time taken for ${iterations} get hit counts operations: ${getHitCountsTime.toFixed(2)} ms`,
    );

    expect(getHitCountsTime).toBeLessThan(500); // Expecting less than 500 ms for 100,000 operations
  });

  it('should handle rapid alternating increment operations efficiently', () => {
    log('\nTesting performance of rapid alternating increment operations...');

    const iterations = 100000;
    const identifier = 'testId';
    const storeName = 'testStore';

    const alternatingIncrementTime = measureExecutionTime(() => {
      for (let i = 0; i < iterations; i++) {
        if (i % 2 === 0) {
          HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
        } else {
          HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
        }
      }
    });

    log(
      `Time taken for ${iterations} alternating increment operations: ${alternatingIncrementTime.toFixed(2)} ms`,
    );

    expect(alternatingIncrementTime).toBeLessThan(1000); // Expecting less than 1 second for 100,000 operations
  });

  it('should perform efficiently with multiple identifiers and store names', () => {
    log('\nTesting performance with multiple identifiers and store names...');

    const iterations = 10000;
    const identifiers = ['id1', 'id2', 'id3', 'id4', 'id5'];
    const storeNames = ['store1', 'store2', 'store3', 'store4', 'store5'];

    const multipleIdStoreTime = measureExecutionTime(() => {
      for (let i = 0; i < iterations; i++) {
        const identifier = identifiers[i % identifiers.length];
        const storeName = storeNames[i % storeNames.length];
        HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
        HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
        HitCountModule.getHitCounts(mockGet, identifier, storeName);
      }
    });

    log(
      `Time taken for ${iterations} operations with multiple identifiers and store names: ${multipleIdStoreTime.toFixed(2)} ms`,
    );

    expect(multipleIdStoreTime).toBeLessThan(1000); // Expecting less than 1 second for 10,000 complex operations
  });

  it('should handle large hit counts efficiently', () => {
    log('\nTesting performance with large hit counts...');

    const identifier = 'testId';
    const storeName = 'testStore';
    const largeCount = 1000000000; // 1 billion

    HitCountModule.setHitCounts(mockSet, identifier, storeName, largeCount, largeCount);

    const largeCountIncrementTime = measureExecutionTime(() => {
      for (let i = 0; i < 1000; i++) {
        HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
        HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
      }
    });

    log(
      `Time taken for 2000 increment operations on large counts: ${largeCountIncrementTime.toFixed(2)} ms`,
    );

    expect(largeCountIncrementTime).toBeLessThan(100); // Expecting less than 100 ms for 2000 operations on large numbers
  });
});
