import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('memory-usage-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Memory Usage', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Memory Usage tests...');
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

  const getMemoryUsage = (): number => {
    if (global.gc) {
      global.gc();
    }
    return process.memoryUsage().heapUsed;
  };

  it('should have consistent memory usage for repeated operations', () => {
    log('\nTesting memory usage for repeated operations...');

    const initialMemory = getMemoryUsage();
    log(`Initial memory usage: ${initialMemory} bytes`);

    const operations = 1000000;
    for (let i = 0; i < operations; i++) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
      HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    const finalMemory = getMemoryUsage();
    log(`Final memory usage: ${finalMemory} bytes`);

    const memoryDifference = finalMemory - initialMemory;
    log(`Memory usage difference: ${memoryDifference} bytes`);

    expect(memoryDifference).toBeLessThan(1000000); // Assuming less than 1MB increase
  });

  it('should have limited memory impact for multiple identifiers', () => {
    log('\nTesting memory impact for multiple identifiers...');

    const initialMemory = getMemoryUsage();
    log(`Initial memory usage: ${initialMemory} bytes`);

    const identifiers = 10000;
    for (let i = 0; i < identifiers; i++) {
      const id = `id${i}`;
      HitCountModule.incrementGetHitCount(mockGet, mockSet, id, 'testStore');
      HitCountModule.incrementSetHitCount(mockGet, mockSet, id, 'testStore');
    }

    const finalMemory = getMemoryUsage();
    log(`Final memory usage: ${finalMemory} bytes`);

    const memoryDifference = finalMemory - initialMemory;
    log(`Memory usage difference: ${memoryDifference} bytes`);

    const averagePerIdentifier = memoryDifference / identifiers;
    log(`Average memory usage per identifier: ${averagePerIdentifier} bytes`);

    expect(averagePerIdentifier).toBeLessThan(100); // Assuming less than 100 bytes per identifier
  });

  it('should have consistent memory usage for large hit counts', () => {
    log('\nTesting memory usage for large hit counts...');

    const initialMemory = getMemoryUsage();
    log(`Initial memory usage: ${initialMemory} bytes`);

    const largeCount = 1000000000;
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', largeCount, largeCount);

    for (let i = 0; i < 1000; i++) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
      HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    const finalMemory = getMemoryUsage();
    log(`Final memory usage: ${finalMemory} bytes`);

    const memoryDifference = finalMemory - initialMemory;
    log(`Memory usage difference: ${memoryDifference} bytes`);

    expect(memoryDifference).toBeLessThan(10000); // Assuming less than 10KB increase
  });

  it('should have limited memory impact for rapid increments', () => {
    log('\nTesting memory impact for rapid increments...');

    const initialMemory = getMemoryUsage();
    log(`Initial memory usage: ${initialMemory} bytes`);

    const iterations = 1000000;
    for (let i = 0; i < iterations; i++) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    const finalMemory = getMemoryUsage();
    log(`Final memory usage: ${finalMemory} bytes`);

    const memoryDifference = finalMemory - initialMemory;
    log(`Memory usage difference: ${memoryDifference} bytes`);

    expect(memoryDifference).toBeLessThan(1000000); // Assuming less than 1MB increase
  });

  it('should have consistent memory usage after reset', () => {
    log('\nTesting memory usage after reset...');

    const initialMemory = getMemoryUsage();
    log(`Initial memory usage: ${initialMemory} bytes`);

    for (let i = 0; i < 1000000; i++) {
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
      HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 0, 0);

    const finalMemory = getMemoryUsage();
    log(`Final memory usage: ${finalMemory} bytes`);

    const memoryDifference = finalMemory - initialMemory;
    log(`Memory usage difference: ${memoryDifference} bytes`);

    expect(memoryDifference).toBeLessThan(10000); // Assuming less than 10KB difference after reset
  });
});
