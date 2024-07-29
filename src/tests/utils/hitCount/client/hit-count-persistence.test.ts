import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('hit-count-persistence-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Persistence', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Persistence tests...');
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

  it('should persist hit counts across multiple operations', () => {
    log('\nTesting hit count persistence across multiple operations...');

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');

    let { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Initial get hit count: ${getHitCount}, set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');

    ({ getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore'));
    log(`Updated get hit count: ${getHitCount}, set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(3);
    expect(setHitCount).toBe(2);
  });

  it('should persist hit counts for multiple identifiers', () => {
    log('\nTesting hit count persistence for multiple identifiers...');

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'id1', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'id2', 'testStore');

    let counts1 = HitCountModule.getHitCounts(mockGet, 'id1', 'testStore');
    let counts2 = HitCountModule.getHitCounts(mockGet, 'id2', 'testStore');

    log(`id1 initial counts - get: ${counts1.getHitCount}, set: ${counts1.setHitCount}`);
    log(`id2 initial counts - get: ${counts2.getHitCount}, set: ${counts2.setHitCount}`);

    expect(counts1.getHitCount).toBe(1);
    expect(counts1.setHitCount).toBe(0);
    expect(counts2.getHitCount).toBe(0);
    expect(counts2.setHitCount).toBe(1);

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'id1', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'id2', 'testStore');

    counts1 = HitCountModule.getHitCounts(mockGet, 'id1', 'testStore');
    counts2 = HitCountModule.getHitCounts(mockGet, 'id2', 'testStore');

    log(`id1 updated counts - get: ${counts1.getHitCount}, set: ${counts1.setHitCount}`);
    log(`id2 updated counts - get: ${counts2.getHitCount}, set: ${counts2.setHitCount}`);

    expect(counts1.getHitCount).toBe(2);
    expect(counts1.setHitCount).toBe(0);
    expect(counts2.getHitCount).toBe(0);
    expect(counts2.setHitCount).toBe(2);
  });

  it('should persist hit counts after setting them directly', () => {
    log('\nTesting hit count persistence after setting them directly...');

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 5, 10);

    let { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Initial get hit count: ${getHitCount}, set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(5);
    expect(setHitCount).toBe(10);

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');

    ({ getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore'));
    log(`Updated get hit count: ${getHitCount}, set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(6);
    expect(setHitCount).toBe(11);
  });

  it('should handle persistence of large hit counts', () => {
    log('\nTesting persistence of large hit counts...');

    const largeCount = 1000000;
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', largeCount, largeCount);

    let { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Initial large get hit count: ${getHitCount}, set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(largeCount);
    expect(setHitCount).toBe(largeCount);

    for (let i = 0; i < 1000; i++) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
      HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    ({ getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore'));
    log(`Updated large get hit count: ${getHitCount}, set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(largeCount + 1000);
    expect(setHitCount).toBe(largeCount + 1000);
  });
});
