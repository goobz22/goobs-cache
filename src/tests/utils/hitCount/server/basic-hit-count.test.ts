import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('basic-hit-count-server-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Basic Hit Count', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Basic Hit Count tests...');
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

  it('should initialize hit counts to zero', async () => {
    log('\nTesting hit count initialization...');

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Initial get hit count: ${getHitCount}`);
    log(`Initial set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should increment get hit count', async () => {
    log('\nTesting get hit count increment...');

    const newCount = await HitCountModule.incrementGetHitCount(
      mockGet,
      mockSet,
      'testId',
      'testStore',
    );
    log(`New get hit count: ${newCount}`);
    expect(newCount).toBe(1);

    const { getHitCount } = await HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Retrieved get hit count: ${getHitCount}`);
    expect(getHitCount).toBe(1);
  });

  it('should increment set hit count', async () => {
    log('\nTesting set hit count increment...');

    const newCount = await HitCountModule.incrementSetHitCount(
      mockGet,
      mockSet,
      'testId',
      'testStore',
    );
    log(`New set hit count: ${newCount}`);
    expect(newCount).toBe(1);

    const { setHitCount } = await HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Retrieved set hit count: ${setHitCount}`);
    expect(setHitCount).toBe(1);
  });

  it('should set hit counts', async () => {
    log('\nTesting setting hit counts...');

    await HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 5, 10);

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Set get hit count: ${getHitCount}`);
    log(`Set set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(5);
    expect(setHitCount).toBe(10);
  });

  it('should handle multiple increments', async () => {
    log('\nTesting multiple increments...');

    for (let i = 0; i < 5; i++) {
      await HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
      await HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    }

    const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Final get hit count: ${getHitCount}`);
    log(`Final set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(5);
    expect(setHitCount).toBe(5);
  });
});
