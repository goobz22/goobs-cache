import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('concurrent-operations-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Concurrent Operations', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Concurrent Operations tests...');
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

  it('should handle concurrent get hit count increments', async () => {
    log('\nTesting concurrent get hit count increments...');
    const concurrentOperations = 100;
    const incrementPromises = Array(concurrentOperations)
      .fill(null)
      .map(() =>
        Promise.resolve(
          HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore'),
        ),
      );

    const results = await Promise.all(incrementPromises);
    log(`Concurrent operations completed: ${results.length}`);

    const { getHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Final get hit count: ${getHitCount}`);
    expect(getHitCount).toBe(concurrentOperations);
  });

  it('should handle concurrent set hit count increments', async () => {
    log('\nTesting concurrent set hit count increments...');
    const concurrentOperations = 100;
    const incrementPromises = Array(concurrentOperations)
      .fill(null)
      .map(() =>
        Promise.resolve(
          HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore'),
        ),
      );

    const results = await Promise.all(incrementPromises);
    log(`Concurrent operations completed: ${results.length}`);

    const { setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Final set hit count: ${setHitCount}`);
    expect(setHitCount).toBe(concurrentOperations);
  });

  it('should handle concurrent get and set hit count increments', async () => {
    log('\nTesting concurrent get and set hit count increments...');
    const concurrentOperations = 50;
    const incrementPromises = Array(concurrentOperations)
      .fill(null)
      .flatMap(() => [
        Promise.resolve(
          HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore'),
        ),
        Promise.resolve(
          HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore'),
        ),
      ]);

    const results = await Promise.all(incrementPromises);
    log(`Concurrent operations completed: ${results.length}`);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Final get hit count: ${getHitCount}`);
    log(`Final set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(concurrentOperations);
    expect(setHitCount).toBe(concurrentOperations);
  });

  it('should handle concurrent operations on multiple identifiers', async () => {
    log('\nTesting concurrent operations on multiple identifiers...');
    const concurrentOperations = 50;
    const identifiers = ['id1', 'id2', 'id3', 'id4', 'id5'];

    const incrementPromises = Array(concurrentOperations)
      .fill(null)
      .flatMap(() =>
        identifiers.map((id) =>
          Promise.resolve(HitCountModule.incrementGetHitCount(mockGet, mockSet, id, 'testStore')),
        ),
      );

    const results = await Promise.all(incrementPromises);
    log(`Concurrent operations completed: ${results.length}`);

    for (const id of identifiers) {
      const { getHitCount } = HitCountModule.getHitCounts(mockGet, id, 'testStore');
      log(`Final get hit count for ${id}: ${getHitCount}`);
      expect(getHitCount).toBe(concurrentOperations);
    }
  });
});
