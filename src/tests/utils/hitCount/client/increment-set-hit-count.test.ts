import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('increment-set-hit-count-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Increment Set Hit Count', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Increment Set Hit Count tests...');
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

  it('should increment set hit count from zero', () => {
    log('\nTesting increment set hit count from zero...');

    const newCount = HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    log(`New set hit count: ${newCount}`);
    expect(newCount).toBe(1);

    const { setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Retrieved set hit count: ${setHitCount}`);
    expect(setHitCount).toBe(1);
  });

  it('should increment set hit count multiple times', () => {
    log('\nTesting multiple increments of set hit count...');

    for (let i = 1; i <= 5; i++) {
      const newCount = HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
      log(`Increment ${i}: New set hit count: ${newCount}`);
      expect(newCount).toBe(i);
    }

    const { setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Final retrieved set hit count: ${setHitCount}`);
    expect(setHitCount).toBe(5);
  });

  it('should increment set hit count for different identifiers', () => {
    log('\nTesting increment set hit count for different identifiers...');

    const count1 = HitCountModule.incrementSetHitCount(mockGet, mockSet, 'id1', 'testStore');
    const count2 = HitCountModule.incrementSetHitCount(mockGet, mockSet, 'id2', 'testStore');

    log(`id1 set hit count: ${count1}`);
    log(`id2 set hit count: ${count2}`);

    expect(count1).toBe(1);
    expect(count2).toBe(1);

    const { setHitCount: setHitCount1 } = HitCountModule.getHitCounts(mockGet, 'id1', 'testStore');
    const { setHitCount: setHitCount2 } = HitCountModule.getHitCounts(mockGet, 'id2', 'testStore');

    log(`Retrieved id1 set hit count: ${setHitCount1}`);
    log(`Retrieved id2 set hit count: ${setHitCount2}`);

    expect(setHitCount1).toBe(1);
    expect(setHitCount2).toBe(1);
  });

  it('should increment set hit count for different store names', () => {
    log('\nTesting increment set hit count for different store names...');

    const count1 = HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'store1');
    const count2 = HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'store2');

    log(`store1 set hit count: ${count1}`);
    log(`store2 set hit count: ${count2}`);

    expect(count1).toBe(1);
    expect(count2).toBe(1);

    const { setHitCount: setHitCount1 } = HitCountModule.getHitCounts(mockGet, 'testId', 'store1');
    const { setHitCount: setHitCount2 } = HitCountModule.getHitCounts(mockGet, 'testId', 'store2');

    log(`Retrieved store1 set hit count: ${setHitCount1}`);
    log(`Retrieved store2 set hit count: ${setHitCount2}`);

    expect(setHitCount1).toBe(1);
    expect(setHitCount2).toBe(1);
  });

  it('should handle large number of increments', () => {
    log('\nTesting large number of set hit count increments...');

    const largeNumber = 1000000;
    for (let i = 0; i < largeNumber; i++) {
      HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    const { setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Set hit count after ${largeNumber} increments: ${setHitCount}`);
    expect(setHitCount).toBe(largeNumber);
  });
});
