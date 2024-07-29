import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('invalid-input-handling-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Invalid Input Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Invalid Input Handling tests...');
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

  it('should handle empty string identifier for incrementGetHitCount', () => {
    log('\nTesting incrementGetHitCount with empty string identifier...');

    const newCount = HitCountModule.incrementGetHitCount(mockGet, mockSet, '', 'testStore');
    log(`New get hit count: ${newCount}`);
    expect(newCount).toBe(1);

    const { getHitCount } = HitCountModule.getHitCounts(mockGet, '', 'testStore');
    log(`Retrieved get hit count: ${getHitCount}`);
    expect(getHitCount).toBe(1);
  });

  it('should handle empty string identifier for incrementSetHitCount', () => {
    log('\nTesting incrementSetHitCount with empty string identifier...');

    const newCount = HitCountModule.incrementSetHitCount(mockGet, mockSet, '', 'testStore');
    log(`New set hit count: ${newCount}`);
    expect(newCount).toBe(1);

    const { setHitCount } = HitCountModule.getHitCounts(mockGet, '', 'testStore');
    log(`Retrieved set hit count: ${setHitCount}`);
    expect(setHitCount).toBe(1);
  });

  it('should handle empty string store name for getHitCounts', () => {
    log('\nTesting getHitCounts with empty string store name...');

    HitCountModule.incrementGetHitCount(mockGet, mockSet, 'testId', '');
    HitCountModule.incrementSetHitCount(mockGet, mockSet, 'testId', '');

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, 'testId', '');
    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle empty string identifier and store name for setHitCounts', () => {
    log('\nTesting setHitCounts with empty string identifier and store name...');

    HitCountModule.setHitCounts(mockSet, '', '', 5, 10);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(mockGet, '', '');
    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(5);
    expect(setHitCount).toBe(10);
  });

  it('should handle invalid hit count values in storage', () => {
    log('\nTesting getHitCounts with invalid hit count values in storage...');

    mockStorage['testId:testStore:getHitCount'] = 'invalid';
    mockStorage['testId:testStore:setHitCount'] = 'NaN';

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      'testId',
      'testStore',
    );
    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);
    expect(getHitCount).toBe(0);
    expect(setHitCount).toBe(0);
  });

  it('should handle very long identifier and store name', () => {
    log('\nTesting with very long identifier and store name...');

    const longString = 'a'.repeat(1000);

    const newGetCount = HitCountModule.incrementGetHitCount(
      mockGet,
      mockSet,
      longString,
      longString,
    );
    const newSetCount = HitCountModule.incrementSetHitCount(
      mockGet,
      mockSet,
      longString,
      longString,
    );

    log(`New get hit count: ${newGetCount}`);
    log(`New set hit count: ${newSetCount}`);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      longString,
      longString,
    );
    log(`Retrieved get hit count: ${getHitCount}`);
    log(`Retrieved set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });
});
