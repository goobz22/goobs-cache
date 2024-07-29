import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('hit-count-reset-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Hit Count Reset', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Hit Count Reset tests...');
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

  it('should reset hit counts to zero', async () => {
    log('\nTesting hit count reset to zero...');
    const identifier = 'testId';
    const storeName = 'testStore';

    // Set initial hit counts
    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 10, 20);

    // Verify initial hit counts
    let { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    expect(getHitCount).toBe(10);
    expect(setHitCount).toBe(20);

    // Reset hit counts to zero
    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 0, 0);

    // Verify reset hit counts
    ({ getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    ));
    log(`Reset get hit count: ${getHitCount}`);
    log(`Reset set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should reset hit counts after multiple increments', async () => {
    log('\nTesting hit count reset after multiple increments...');
    const identifier = 'testId';
    const storeName = 'testStore';

    // Perform multiple increments
    for (let i = 0; i < 5; i++) {
      await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    // Verify incremented hit counts
    let { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    expect(getHitCount).toBe(5);
    expect(setHitCount).toBe(5);

    // Reset hit counts to zero
    await HitCountModule.setHitCounts(mockSet, identifier, storeName, 0, 0);

    // Verify reset hit counts
    ({ getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    ));
    log(`Reset get hit count after increments: ${getHitCount}`);
    log(`Reset set hit count after increments: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });
});
