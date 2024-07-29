import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('basic-hit-count-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities tests...');
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

  it('should initialize hit counts to zero', () => {
    log('\nTesting hit count initialization...');
    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Initial get hit count: ${getHitCount}`);
    log(`Initial set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should increment get hit count', () => {
    log('\nTesting get hit count increment...');
    const newCount = HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', 'testStore');
    log(`New get hit count: ${newCount}`);
    expect(newCount).toBe(1);
    const { getHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Retrieved get hit count: ${getHitCount}`);
    expect(getHitCount).toBe(1);
  });

  it('should increment set hit count', () => {
    log('\nTesting set hit count increment...');
    const newCount = HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', 'testStore');
    log(`New set hit count: ${newCount}`);
    expect(newCount).toBe(1);
    const { setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', 'testStore');
    log(`Retrieved set hit count: ${setHitCount}`);
    expect(setHitCount).toBe(1);
  });

  it('should set hit counts', () => {
    log('\nTesting setting hit counts...');
    HitCountModule.setHitCounts(mockSet, 'testId', 'testStore', 5, 10);
    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Set get hit count: ${getHitCount}`);
    log(`Set set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(5);
    expect(setHitCount).toBe(10);
  });

  it('should handle multiple increments', () => {
    log('\nTesting multiple increments...');
    for (let i = 0; i < 5; i++) {
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
    expect(getHitCount).toBe(5);
    expect(setHitCount).toBe(5);
  });
});
