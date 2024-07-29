import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('get-hit-counts-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Get Hit Counts', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Get Hit Counts tests...');
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

  it('should return zero for both counts when no hits have occurred', () => {
    log('\nTesting get hit counts with no prior hits...');
    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should return correct counts after incrementing', () => {
    log('\nTesting get hit counts after incrementing...');
    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(2);
    expect(setHitCount).toBe(1);
  });

  it('should return correct counts for different identifiers', () => {
    log('\nTesting get hit counts for different identifiers...');
    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'id1', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'id2', 'testStore');

    const counts1 = HitCountModule.getHitCounts(mockGet, 'id1', 'testStore');
    const counts2 = HitCountModule.getHitCounts(mockGet, 'id2', 'testStore');

    log(`id1 - Get hit count: ${counts1.getHitCount}, Set hit count: ${counts1.setHitCount}`);
    log(`id2 - Get hit count: ${counts2.getHitCount}, Set hit count: ${counts2.setHitCount}`);

    expect(counts1.getHitCount).toBe(1);
    expect(counts1.setHitCount).toBe(0);
    expect(counts2.getHitCount).toBe(0);
    expect(counts2.setHitCount).toBe(1);
  });

  it('should return correct counts for different store names', () => {
    log('\nTesting get hit counts for different store names...');
    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'store1');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'store2');

    const counts1 = HitCountModule.getHitCounts(mockGet, 'testId', 'store1');
    const counts2 = HitCountModule.getHitCounts(mockGet, 'testId', 'store2');

    log(`store1 - Get hit count: ${counts1.getHitCount}, Set hit count: ${counts1.setHitCount}`);
    log(`store2 - Get hit count: ${counts2.getHitCount}, Set hit count: ${counts2.setHitCount}`);

    expect(counts1.getHitCount).toBe(1);
    expect(counts1.setHitCount).toBe(0);
    expect(counts2.getHitCount).toBe(0);
    expect(counts2.setHitCount).toBe(1);
  });

  it('should handle large hit counts', () => {
    log('\nTesting get hit counts with large numbers...');
    const largeCount = 1000000;
    for (let i = 0; i < largeCount; i++) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
      HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(largeCount);
    expect(setHitCount).toBe(largeCount);
  });
});
