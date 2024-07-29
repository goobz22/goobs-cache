import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('maximum-hit-count-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Maximum Hit Count', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Maximum Hit Count tests...');
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

  it('should handle incrementing at Number.MAX_SAFE_INTEGER', () => {
    log('\nTesting increment at Number.MAX_SAFE_INTEGER...');

    const maxSafeInteger = Number.MAX_SAFE_INTEGER;
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', maxSafeInteger, maxSafeInteger);

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

    log(`New get hit count: ${newGetCount}`);
    log(`New set hit count: ${newSetCount}`);

    expect(newGetCount).toBe(maxSafeInteger + 1);
    expect(newSetCount).toBe(maxSafeInteger + 1);
  });

  it('should handle setting hit counts beyond Number.MAX_SAFE_INTEGER', () => {
    log('\nTesting setting hit counts beyond Number.MAX_SAFE_INTEGER...');

    const beyondMaxSafe = Number.MAX_SAFE_INTEGER + 1000;
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', beyondMaxSafe, beyondMaxSafe);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(beyondMaxSafe);
    expect(setHitCount).toBe(beyondMaxSafe);
  });

  it('should handle incrementing beyond Number.MAX_SAFE_INTEGER', () => {
    log('\nTesting incrementing beyond Number.MAX_SAFE_INTEGER...');

    const startValue = Number.MAX_SAFE_INTEGER - 5;
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', startValue, startValue);

    for (let i = 0; i < 10; i++) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
      HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Final get hit count: ${getHitCount}`);
    log(`Final set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(Number.MAX_SAFE_INTEGER + 5);
    expect(setHitCount).toBe(Number.MAX_SAFE_INTEGER + 5);
  });

  it('should handle very large numbers', () => {
    log('\nTesting with very large numbers...');

    const veryLargeNumber = Number.MAX_VALUE;
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', veryLargeNumber, veryLargeNumber);

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

    log(`New get hit count: ${newGetCount}`);
    log(`New set hit count: ${newSetCount}`);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(Infinity);
    expect(setHitCount).toBe(Infinity);
  });

  it('should handle hit counts at Number.MAX_VALUE', () => {
    log('\nTesting hit counts at Number.MAX_VALUE...');

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', Number.MAX_VALUE, Number.MAX_VALUE);

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

    log(`New get hit count: ${newGetCount}`);
    log(`New set hit count: ${newSetCount}`);

    expect(newGetCount).toBe(Infinity);
    expect(newSetCount).toBe(Infinity);
  });

  it('should handle multiple identifiers with maximum hit counts', () => {
    log('\nTesting multiple identifiers with maximum hit counts...');

    const identifiers = ['id1', 'id2', 'id3'];
    const maxSafeInteger = Number.MAX_SAFE_INTEGER;

    for (const id of identifiers) {
      HitCountModule.setHitCounts(mockSet, id, 'testStore', maxSafeInteger, maxSafeInteger);
      HitCountModule.incrementGetHitCount(mockGet, mockSet, id, 'testStore');
      HitCountModule.incrementSetHitCount(mockGet, mockSet, id, 'testStore');
    }

    for (const id of identifiers) {
      const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, id, 'testStore');
      log(`${id} get hit count: ${getHitCount}`);
      log(`${id} set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(maxSafeInteger + 1);
      expect(setHitCount).toBe(maxSafeInteger + 1);
    }
  });
});
