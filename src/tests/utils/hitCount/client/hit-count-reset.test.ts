import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('hit-count-reset-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Reset', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Reset tests...');
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

  it('should reset hit counts to zero', () => {
    log('\nTesting hit count reset to zero...');

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');

    let { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Initial get hit count: ${getHitCount}, set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 0, 0);

    ({ getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore'));
    log(`Reset get hit count: ${getHitCount}, set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should handle resetting after large counts', () => {
    log('\nTesting hit count reset after large counts...');

    const largeCount = 1000000;
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', largeCount, largeCount);

    let { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Initial large get hit count: ${getHitCount}, set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(largeCount);
    expect(setHitCount).toBe(largeCount);

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 0, 0);

    ({ getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore'));
    log(`Reset get hit count: ${getHitCount}, set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should reset counts for specific identifier and store', () => {
    log('\nTesting hit count reset for specific identifier and store...');

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'id1', 'store1');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'id1', 'store1');
    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'id2', 'store2');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'id2', 'store2');

    let counts1 = HitCountModule.getHitCounts(mockGet, 'id1', 'store1');
    let counts2 = HitCountModule.getHitCounts(mockGet, 'id2', 'store2');

    log(`id1 initial counts - get: ${counts1.getHitCount}, set: ${counts1.setHitCount}`);
    log(`id2 initial counts - get: ${counts2.getHitCount}, set: ${counts2.setHitCount}`);

    HitCountModule.setHitCounts(mockSet, 'id1', 'store1', 0, 0);

    counts1 = HitCountModule.getHitCounts(mockGet, 'id1', 'store1');
    counts2 = HitCountModule.getHitCounts(mockGet, 'id2', 'store2');

    log(`id1 reset counts - get: ${counts1.getHitCount}, set: ${counts1.setHitCount}`);
    log(`id2 unchanged counts - get: ${counts2.getHitCount}, set: ${counts2.setHitCount}`);

    expect(counts1.getHitCount).toBe(0);
    expect(counts1.setHitCount).toBe(0);
    expect(counts2.getHitCount).toBe(1);
    expect(counts2.setHitCount).toBe(1);
  });

  it('should handle increment after reset', () => {
    log('\nTesting increment after hit count reset...');

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 10, 20);
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 0, 0);

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Incremented after reset - get: ${getHitCount}, set: ${setHitCount}`);
    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });
});
