import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('invalid-input-handling-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Invalid Input Handling', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Invalid Input Handling tests...');
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

  it('should throw an error for invalid identifier or store name', async () => {
    log('\nTesting with invalid identifier and store name...');
    const invalidIdentifier = '';
    const invalidStoreName = '';

    await expect(
      HitCountModule.getHitCounts(mockGet, invalidIdentifier, invalidStoreName),
    ).rejects.toThrow();
    await expect(
      HitCountModule.incrementGetHitCount(mockGet, mockSet, invalidIdentifier, invalidStoreName),
    ).rejects.toThrow();
    await expect(
      HitCountModule.incrementSetHitCount(mockGet, mockSet, invalidIdentifier, invalidStoreName),
    ).rejects.toThrow();
    await expect(
      HitCountModule.setHitCounts(mockSet, invalidIdentifier, invalidStoreName, 0, 0),
    ).rejects.toThrow();

    log('All Hit Count module functions threw an error for invalid identifier and store name');
  });

  it('should throw an error for negative hit count values', async () => {
    log('\nTesting with negative hit count values...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const negativeGetHitCount = -5;
    const negativeSetHitCount = -3;

    await expect(
      HitCountModule.setHitCounts(mockSet, identifier, storeName, negativeGetHitCount, 0),
    ).rejects.toThrow();
    await expect(
      HitCountModule.setHitCounts(mockSet, identifier, storeName, 0, negativeSetHitCount),
    ).rejects.toThrow();

    log('setHitCounts function threw an error for negative hit count values');
  });

  it('should throw an error for non-numeric hit count values', async () => {
    log('\nTesting with non-numeric hit count values...');
    const identifier = 'testId';
    const storeName = 'testStore';
    const nonNumericGetHitCount = 'abc';
    const nonNumericSetHitCount = '123abc';

    await expect(
      HitCountModule.setHitCounts(
        mockSet,
        identifier,
        storeName,
        nonNumericGetHitCount as unknown as number,
        0,
      ),
    ).rejects.toThrow();
    await expect(
      HitCountModule.setHitCounts(
        mockSet,
        identifier,
        storeName,
        0,
        nonNumericSetHitCount as unknown as number,
      ),
    ).rejects.toThrow();

    log('setHitCounts function threw an error for non-numeric hit count values');
  });
});
