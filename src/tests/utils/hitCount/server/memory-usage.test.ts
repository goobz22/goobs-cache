import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('memory-usage-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Memory Usage', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Memory Usage tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = async (key: string): Promise<string | null> => mockStorage[key] || null;
    mockSet = async (key: string, value: string): Promise<void> => {
      mockStorage[key] = value;
    };
  });

  afterAll(() => {
    logStream.end();
  });

  it('should not exceed memory limits for a large number of hit count operations', async () => {
    log('\nTesting memory usage for a large number of hit count operations...');
    const numOperations = 100000;
    const identifier = 'testId';
    const storeName = 'testStore';

    const initialMemoryUsage = process.memoryUsage().heapUsed;
    log(`Initial heap used: ${initialMemoryUsage} bytes`);

    for (let i = 0; i < numOperations; i++) {
      await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    const finalMemoryUsage = process.memoryUsage().heapUsed;
    log(`Final heap used: ${finalMemoryUsage} bytes`);

    const memoryIncrease = finalMemoryUsage - initialMemoryUsage;
    log(`Memory increase: ${memoryIncrease} bytes`);

    const averageMemoryPerOperation = memoryIncrease / (numOperations * 2);
    log(`Average memory per operation: ${averageMemoryPerOperation} bytes`);

    expect(averageMemoryPerOperation).toBeLessThan(1000); // Assuming less than 1KB per operation

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    expect(getHitCount).toBe(numOperations);
    expect(setHitCount).toBe(numOperations);
  });

  it('should handle memory efficiently for multiple identifiers and store names', async () => {
    log('\nTesting memory usage for multiple identifiers and store names...');
    const numIdentifiers = 1000;
    const numStoreNames = 10;
    const operationsPerIdentifier = 100;

    const initialMemoryUsage = process.memoryUsage().heapUsed;
    log(`Initial heap used: ${initialMemoryUsage} bytes`);

    for (let i = 0; i < numIdentifiers; i++) {
      const identifier = `testId${i}`;
      for (let j = 0; j < numStoreNames; j++) {
        const storeName = `testStore${j}`;
        for (let k = 0; k < operationsPerIdentifier; k++) {
          await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
          await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
        }
      }
    }

    const finalMemoryUsage = process.memoryUsage().heapUsed;
    log(`Final heap used: ${finalMemoryUsage} bytes`);

    const memoryIncrease = finalMemoryUsage - initialMemoryUsage;
    log(`Memory increase: ${memoryIncrease} bytes`);

    const totalOperations = numIdentifiers * numStoreNames * operationsPerIdentifier * 2;
    const averageMemoryPerOperation = memoryIncrease / totalOperations;
    log(`Average memory per operation: ${averageMemoryPerOperation} bytes`);

    expect(averageMemoryPerOperation).toBeLessThan(100); // Assuming less than 100 bytes per operation

    const lastIdentifier = `testId${numIdentifiers - 1}`;
    const lastStoreName = `testStore${numStoreNames - 1}`;
    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      lastIdentifier,
      lastStoreName,
    );
    expect(getHitCount).toBe(operationsPerIdentifier);
    expect(setHitCount).toBe(operationsPerIdentifier);
  });
});
