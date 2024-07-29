import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('increment-get-hit-count-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Increment Get Hit Count', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Increment Get Hit Count tests...');
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

  it('should increment get hit count from zero', () => {
    log('\nTesting increment get hit count from zero...');

    const newCount = HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    log(`New get hit count: ${newCount}`);
    expect(newCount).toBe(1);

    const { getHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Retrieved get hit count: ${getHitCount}`);
    expect(getHitCount).toBe(1);
  });

  it('should increment get hit count multiple times', () => {
    log('\nTesting multiple increments of get hit count...');

    for (let i = 1; i <= 5; i++) {
      const newCount = HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
      log(`Increment ${i}: New get hit count: ${newCount}`);
      expect(newCount).toBe(i);
    }

    const { getHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Final retrieved get hit count: ${getHitCount}`);
    expect(getHitCount).toBe(5);
  });

  it('should increment get hit count for different identifiers', () => {
    log('\nTesting increment get hit count for different identifiers...');

    const count1 = HitCountModule.incrementGetHitCount(mockGet, mockSet, 'id1', 'testStore');
    const count2 = HitCountModule.incrementGetHitCount(mockGet, mockSet, 'id2', 'testStore');

    log(`id1 get hit count: ${count1}`);
    log(`id2 get hit count: ${count2}`);

    expect(count1).toBe(1);
    expect(count2).toBe(1);

    const { getHitCount: getHitCount1 } = HitCountModule.getHitCounts(mockGet, 'id1', 'testStore');
    const { getHitCount: getHitCount2 } = HitCountModule.getHitCounts(mockGet, 'id2', 'testStore');

    log(`Retrieved id1 get hit count: ${getHitCount1}`);
    log(`Retrieved id2 get hit count: ${getHitCount2}`);

    expect(getHitCount1).toBe(1);
    expect(getHitCount2).toBe(1);
  });

  it('should increment get hit count for different store names', () => {
    log('\nTesting increment get hit count for different store names...');

    const count1 = HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'store1');
    const count2 = HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'store2');

    log(`store1 get hit count: ${count1}`);
    log(`store2 get hit count: ${count2}`);

    expect(count1).toBe(1);
    expect(count2).toBe(1);

    const { getHitCount: getHitCount1 } = HitCountModule.getHitCounts(mockGet, 'testId', 'store1');
    const { getHitCount: getHitCount2 } = HitCountModule.getHitCounts(mockGet, 'testId', 'store2');

    log(`Retrieved store1 get hit count: ${getHitCount1}`);
    log(`Retrieved store2 get hit count: ${getHitCount2}`);

    expect(getHitCount1).toBe(1);
    expect(getHitCount2).toBe(1);
  });

  it('should handle large number of increments', () => {
    log('\nTesting large number of get hit count increments...');

    const largeNumber = 1000000;
    for (let i = 0; i < largeNumber; i++) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    const { getHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Get hit count after ${largeNumber} increments: ${getHitCount}`);
    expect(getHitCount).toBe(largeNumber);
  });
});
