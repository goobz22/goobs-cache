import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('zero-hit-counts-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Zero Hit Counts', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Zero Hit Counts tests...');
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
    log('\nTesting initial zero hit counts...');

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Initial get hit count: ${getHitCount}, set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should handle incrementing from zero', () => {
    log('\nTesting incrementing from zero...');

    const newGetCount = HitCountModule.incrementGetHitCount(
      mockGet,
      mockSet,
      'testId',
      'testStore',
    );
    const newSetCount = HitCountModule.incrementSetHitCount(
      mockGet,
      mockSet,
      'testId',
      'testStore',
    );

    log(`New get hit count: ${newGetCount}, new set hit count: ${newSetCount}`);

    expect(newGetCount).toBe(1);
    expect(newSetCount).toBe(1);
  });

  it('should allow setting hit counts to zero', () => {
    log('\nTesting setting hit counts to zero...');

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 0, 0);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Get hit count after reset: ${getHitCount}, set hit count after reset: ${setHitCount}`);

    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should handle incrementing after resetting to zero', () => {
    log('\nTesting incrementing after resetting to zero...');

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 0, 0);

    const newGetCount = HitCountModule.incrementGetHitCount(
      mockGet,
      mockSet,
      'testId',
      'testStore',
    );
    const newSetCount = HitCountModule.incrementSetHitCount(
      mockGet,
      mockSet,
      'testId',
      'testStore',
    );

    log(
      `New get hit count after reset: ${newGetCount}, new set hit count after reset: ${newSetCount}`,
    );

    expect(newGetCount).toBe(1);
    expect(newSetCount).toBe(1);
  });

  it('should handle multiple resets to zero', () => {
    log('\nTesting multiple resets to zero...');

    for (let i = 0; i < 3; i++) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
      HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
      HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 0, 0);

      const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
        mockGet,
        'testId',
        'testStore',
      );
      log(`Iteration ${i + 1} - Get hit count: ${getHitCount}, set hit count: ${setHitCount}`);

      expect(getHitCount).toBe(0);
      expect(setHitCount).toBe(0);
    }
  });

  it('should handle zero hit counts with multiple identifiers', () => {
    log('\nTesting zero hit counts with multiple identifiers...');

    const identifiers = ['id1', 'id2', 'id3'];
    const storeName = 'testStore';

    for (const id of identifiers) {
      const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, id, storeName);
      log(`${id} - Initial get hit count: ${getHitCount}, set hit count: ${setHitCount}`);

      expect(getHitCount).toBe(0);
      expect(setHitCount).toBe(0);
    }
  });

  it('should return zero for non-existent keys', () => {
    log('\nTesting retrieval of non-existent keys...');

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'nonExistentId',
      'nonExistentStore',
    );
    log(`Non-existent key - get hit count: ${getHitCount}, set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });
});
