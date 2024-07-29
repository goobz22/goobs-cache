import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('concurrent-operations-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Concurrent Operations', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Concurrent Operations tests...');
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

  it('should handle concurrent get hit count increments', async () => {
    log('\nTesting concurrent get hit count increments...');
    const numIncrements = 10;
    const promises = Array.from({ length: numIncrements }, () =>
      HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore'),
    );
    await Promise.all(promises);
    const { getHitCount } = await HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Final get hit count after ${numIncrements} concurrent increments: ${getHitCount}`);
    expect(getHitCount).toBe(numIncrements);
  });

  it('should handle concurrent set hit count increments', async () => {
    log('\nTesting concurrent set hit count increments...');
    const numIncrements = 10;
    const promises = Array.from({ length: numIncrements }, () =>
      HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore'),
    );
    await Promise.all(promises);
    const { setHitCount } = await HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Final set hit count after ${numIncrements} concurrent increments: ${setHitCount}`);
    expect(setHitCount).toBe(numIncrements);
  });

  it('should handle mixed concurrent get and set hit count operations', async () => {
    log('\nTesting mixed concurrent get and set hit count operations...');
    const numOperations = 20;
    const promises = Array.from({ length: numOperations }, (_, index) => {
      if (index % 2 === 0) {
        return HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
      } else {
        return HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
      }
    });
    await Promise.all(promises);
    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Final get hit count after ${numOperations} mixed operations: ${getHitCount}`);
    log(`Final set hit count after ${numOperations} mixed operations: ${setHitCount}`);
    expect(getHitCount).toBe(numOperations / 2);
    expect(setHitCount).toBe(numOperations / 2);
  });
});
