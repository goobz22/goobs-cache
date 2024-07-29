import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('hit-count-overflow-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Overflow Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Overflow Handling tests...');
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

  it('should handle incrementing from MAX_SAFE_INTEGER', () => {
    log('\nTesting increment from MAX_SAFE_INTEGER...');
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

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(maxSafeInteger + 1);
    expect(setHitCount).toBe(maxSafeInteger + 1);
  });

  it('should handle setting counts beyond MAX_SAFE_INTEGER', () => {
    log('\nTesting setting counts beyond MAX_SAFE_INTEGER...');
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

  it('should handle incrementing beyond MAX_SAFE_INTEGER', () => {
    log('\nTesting incrementing beyond MAX_SAFE_INTEGER...');
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
});
