import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('large-hit-counts-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Large Hit Counts', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Large Hit Counts tests...');
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

  it('should handle large number of increments for get hit count', () => {
    log('\nTesting large number of increments for get hit count...');

    const largeNumber = 1000000;
    for (let i = 0; i < largeNumber; i++) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    const { getHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Get hit count after ${largeNumber} increments: ${getHitCount}`);
    expect(getHitCount).toBe(largeNumber);
  });

  it('should handle large number of increments for set hit count', () => {
    log('\nTesting large number of increments for set hit count...');

    const largeNumber = 1000000;
    for (let i = 0; i < largeNumber; i++) {
      HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    const { setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Set hit count after ${largeNumber} increments: ${setHitCount}`);
    expect(setHitCount).toBe(largeNumber);
  });

  it('should handle setting large hit counts directly', () => {
    log('\nTesting setting large hit counts directly...');

    const largeNumber = 1000000000;
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', largeNumber, largeNumber);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Retrieved large get hit count: ${getHitCount}`);
    log(`Retrieved large set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(largeNumber);
    expect(setHitCount).toBe(largeNumber);
  });

  it('should handle incrementing from large hit counts', () => {
    log('\nTesting incrementing from large hit counts...');

    const largeNumber = 1000000000;
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', largeNumber, largeNumber);

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

    log(`New get hit count after increment: ${newGetCount}`);
    log(`New set hit count after increment: ${newSetCount}`);

    expect(newGetCount).toBe(largeNumber + 1);
    expect(newSetCount).toBe(largeNumber + 1);
  });

  it('should handle hit counts approaching Number.MAX_SAFE_INTEGER', () => {
    log('\nTesting hit counts approaching Number.MAX_SAFE_INTEGER...');

    const almostMaxSafeInteger = Number.MAX_SAFE_INTEGER - 10;
    HitCountModule.setHitCounts(
      mockSet,
      'testId',
      'testStore',
      almostMaxSafeInteger,
      almostMaxSafeInteger,
    );

    for (let i = 0; i < 20; i++) {
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

    expect(getHitCount).toBe(Number.MAX_SAFE_INTEGER + 10);
    expect(setHitCount).toBe(Number.MAX_SAFE_INTEGER + 10);
  });

  it('should handle multiple large increments for different identifiers', () => {
    log('\nTesting multiple large increments for different identifiers...');

    const largeNumber = 1000000;
    const identifiers = ['id1', 'id2', 'id3'];

    for (const id of identifiers) {
      for (let i = 0; i < largeNumber; i++) {
        HitCountModule.incrementGetHitCount(mockGet, mockSet, id, 'testStore');
        HitCountModule.incrementSetHitCount(mockGet, mockSet, id, 'testStore');
      }
    }

    for (const id of identifiers) {
      const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, id, 'testStore');
      log(`${id} get hit count: ${getHitCount}`);
      log(`${id} set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(largeNumber);
      expect(setHitCount).toBe(largeNumber);
    }
  });
});
