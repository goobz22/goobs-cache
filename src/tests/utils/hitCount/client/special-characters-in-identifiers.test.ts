import * as HitCountModule from '../../../../utils/hitCount.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('special-characters-in-identifiers-test.log');
const log = createLogger(logStream);

describe('Hit Count Client Utilities - Special Characters in Identifiers', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => string | null;
  let mockSet: (key: string, value: string) => void;

  beforeAll(() => {
    log('Starting Hit Count Client Utilities Special Characters in Identifiers tests...');
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

  it('should handle identifiers with spaces', () => {
    log('\nTesting identifiers with spaces...');

    const identifier = 'test id with spaces';
    const storeName = 'testStore';

    HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle identifiers with special characters', () => {
    log('\nTesting identifiers with special characters...');

    const specialCharacters = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`';
    const identifier = `test${specialCharacters}id`;
    const storeName = 'testStore';

    HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle identifiers with Unicode characters', () => {
    log('\nTesting identifiers with Unicode characters...');

    const identifier = 'test🚀😊👍id';
    const storeName = 'testStore';

    HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle identifiers with newline and tab characters', () => {
    log('\nTesting identifiers with newline and tab characters...');

    const identifier = 'test\nid\twith\nnewlines\tand\ttabs';
    const storeName = 'testStore';

    HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle identifiers with very long special character sequences', () => {
    log('\nTesting identifiers with very long special character sequences...');

    const specialCharacters = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`'.repeat(50);
    const identifier = `test${specialCharacters}id`;
    const storeName = 'testStore';

    HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });

  it('should handle identifiers with mixed alphanumeric and special characters', () => {
    log('\nTesting identifiers with mixed alphanumeric and special characters...');

    const identifier = 'test123!@#abc456$%^def789&*()';
    const storeName = 'testStore';

    HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
    HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);

    const { getHitCount, setHitCount } = HitCountModule.getHitCounts(
      mockGet,
      identifier,
      storeName,
    );
    log(`Get hit count: ${getHitCount}, Set hit count: ${setHitCount}`);

    expect(getHitCount).toBe(1);
    expect(setHitCount).toBe(1);
  });
});
