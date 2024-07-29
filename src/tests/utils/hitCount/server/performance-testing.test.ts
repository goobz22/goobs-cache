import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('performance-testing-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Performance Testing', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Performance Testing tests...');
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

  it('should handle a large number of get and set operations', async () => {
    log('\nTesting with a large number of get and set operations...');
    const numOperations = 100000;
    const identifier = 'testId';
    const storeName = 'testStore';

    const startTime = Date.now();

    for (let i = 0; i < numOperations; i++) {
      await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    log(`Performed ${numOperations} get and set operations`);
    log(`Elapsed time: ${elapsedTime} ms`);

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    expect(getHitCount).toBe(numOperations);
    expect(setHitCount).toBe(numOperations);
  });

  it('should handle concurrent get and set operations', async () => {
    log('\nTesting with concurrent get and set operations...');
    const numConcurrentOperations = 1000;
    const identifier = 'testId';
    const storeName = 'testStore';

    const startTime = Date.now();

    const promises = [];
    for (let i = 0; i < numConcurrentOperations; i++) {
      promises.push(HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName));
      promises.push(HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName));
    }
    await Promise.all(promises);

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    log(`Performed ${numConcurrentOperations} concurrent get and set operations`);
    log(`Elapsed time: ${elapsedTime} ms`);

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    expect(getHitCount).toBe(numConcurrentOperations);
    expect(setHitCount).toBe(numConcurrentOperations);
  });
});
