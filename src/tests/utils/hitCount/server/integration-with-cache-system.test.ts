import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('integration-with-cache-system-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Integration with Cache System', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Integration with Cache System tests...');
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

  it('should increment hit counts when getting and setting cache values', async () => {
    log('\nTesting hit count increments with cache get and set operations...');
    const identifier = 'testId';
    const storeName = 'testStore';

    // Simulate cache get operation
    await mockGet(`${identifier}:${storeName}:someKey`);
    let { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count after cache get: ${getHitCount}`);
    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(0);

    // Simulate cache set operation
    await mockSet(`${identifier}:${storeName}:someKey`, 'someValue');
    ({ getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    ));
    log(`Set hit count after cache set: ${setHitCount}`);
    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle multiple cache operations', async () => {
    log('\nTesting hit counts with multiple cache operations...');
    const identifier = 'testId';
    const storeName = 'testStore';

    // Simulate multiple cache get operations
    await mockGet(`${identifier}:${storeName}:key1`);
    await mockGet(`${identifier}:${storeName}:key2`);
    await mockGet(`${identifier}:${storeName}:key3`);
    let { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count after multiple cache gets: ${getHitCount}`);
    expect(getHitCount).toBe(3);
    expect(setHitCount).toBe(0);

    // Simulate multiple cache set operations
    await mockSet(`${identifier}:${storeName}:key1`, 'value1');
    await mockSet(`${identifier}:${storeName}:key2`, 'value2');
    ({ getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    ));
    log(`Set hit count after multiple cache sets: ${setHitCount}`);
    expect(getHitCount).toBe(3);
    expect(setHitCount).toBe(2);
  });

  it('should handle cache operations for different identifiers and store names', async () => {
    log('\nTesting hit counts with different identifiers and store names...');
    const identifier1 = 'testId1';
    const storeName1 = 'testStore1';
    const identifier2 = 'testId2';
    const storeName2 = 'testStore2';

    // Simulate cache operations for different identifiers and store names
    await mockGet(`${identifier1}:${storeName1}:key1`);
    await mockSet(`${identifier1}:${storeName1}:key1`, 'value1');
    await mockGet(`${identifier2}:${storeName2}:key2`);
    await mockSet(`${identifier2}:${storeName2}:key2`, 'value2');

    const { getHitCount: getHitCount1, setHitCount: setHitCount1 } =
      await HitCountModule.getHitCounts(mockGet, identifier1, storeName1);
    const { getHitCount: getHitCount2, setHitCount: setHitCount2 } =
      await HitCountModule.getHitCounts(mockGet, identifier2, storeName2);

    log(`Get hit count for identifier1 and storeName1: ${getHitCount1}`);
    log(`Set hit count for identifier1 and storeName1: ${setHitCount1}`);
    log(`Get hit count for identifier2 and storeName2: ${getHitCount2}`);
    log(`Set hit count for identifier2 and storeName2: ${setHitCount2}`);

    expect(getHitCount1).toBe(1);
    expect(setHitCount1).toBe(1);
    expect(getHitCount2).toBe(1);
    expect(setHitCount2).toBe(1);
  });
});
