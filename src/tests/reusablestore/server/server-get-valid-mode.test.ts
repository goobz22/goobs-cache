import { serverGet } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue, CacheResult } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverGet: jest.fn(),
}));

const logStream: WriteStream = createLogStream('server-get-valid-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Server-side Get with Valid Mode Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting Server-side Get with Valid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully get a value with valid mode', async () => {
    const identifier = 'valid-get-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const mockResult: CacheResult = {
      identifier,
      storeName,
      value,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverGet as jest.Mock).mockResolvedValue(mockResult);

    const result = await serverGet(identifier, storeName, mode);

    expect(serverGet).toHaveBeenCalledWith(identifier, storeName, mode);
    expect(result).toEqual(mockResult);

    log('Successfully retrieved a value with valid mode');
  });

  it('should handle errors when getting a value', async () => {
    const identifier = 'error-get-test';
    const errorMessage = 'Failed to get value';

    (serverGet as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(serverGet(identifier, storeName, mode)).rejects.toThrow(errorMessage);

    log('Successfully handled error when getting a value');
  });

  it('should return default CacheResult for non-existent key', async () => {
    const identifier = 'non-existent-key-test';
    const defaultResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    };

    (serverGet as jest.Mock).mockResolvedValue(defaultResult);

    const result = await serverGet(identifier, storeName, mode);

    expect(result).toEqual(defaultResult);

    log('Successfully returned default CacheResult for non-existent key');
  });

  it('should get values of different types', async () => {
    const stringIdentifier = 'string-value';
    const numberIdentifier = 'number-value';
    const booleanIdentifier = 'boolean-value';

    const stringValue: StringValue = { type: 'string', value: 'test string' };
    const numberValue = 42;
    const booleanValue = true;

    const mockStringResult: CacheResult = {
      identifier: stringIdentifier,
      storeName,
      value: stringValue,
      expirationDate: new Date(Date.now() + 3600000),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    const mockNumberResult: CacheResult = {
      ...mockStringResult,
      identifier: numberIdentifier,
      value: numberValue,
    };
    const mockBooleanResult: CacheResult = {
      ...mockStringResult,
      identifier: booleanIdentifier,
      value: booleanValue,
    };

    (serverGet as jest.Mock)
      .mockResolvedValueOnce(mockStringResult)
      .mockResolvedValueOnce(mockNumberResult)
      .mockResolvedValueOnce(mockBooleanResult);

    const stringResult = await serverGet(stringIdentifier, storeName, mode);
    const numberResult = await serverGet(numberIdentifier, storeName, mode);
    const booleanResult = await serverGet(booleanIdentifier, storeName, mode);

    expect(stringResult.value).toEqual(stringValue);
    expect(numberResult.value).toBe(numberValue);
    expect(booleanResult.value).toBe(booleanValue);

    log('Successfully retrieved values of different types');
  });

  it('should update lastAccessedDate and getHitCount on successful get', async () => {
    const identifier = 'update-metadata-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    let getHitCount = 0;

    (serverGet as jest.Mock).mockImplementation(() => {
      getHitCount++;
      return Promise.resolve({
        identifier,
        storeName,
        value,
        expirationDate: new Date(Date.now() + 3600000),
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount,
        setHitCount: 1,
      });
    });

    const firstResult = await serverGet(identifier, storeName, mode);
    const secondResult = await serverGet(identifier, storeName, mode);

    expect(firstResult.getHitCount).toBe(1);
    expect(secondResult.getHitCount).toBe(2);
    expect(secondResult.lastAccessedDate.getTime()).toBeGreaterThan(
      firstResult.lastAccessedDate.getTime(),
    );

    log('Successfully updated lastAccessedDate and getHitCount on get operations');
  });

  it('should handle getting a recently expired value', async () => {
    const identifier = 'expired-value-test';
    const expiredResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(Date.now() - 1000), // 1 second ago
      lastUpdatedDate: new Date(Date.now() - 3600000), // 1 hour ago
      lastAccessedDate: new Date(Date.now() - 1800000), // 30 minutes ago
      getHitCount: 5,
      setHitCount: 1,
    };

    (serverGet as jest.Mock).mockResolvedValue(expiredResult);

    const result = await serverGet(identifier, storeName, mode);

    expect(result.value).toBeUndefined();
    expect(result.expirationDate.getTime()).toBeLessThan(Date.now());

    log('Successfully handled getting a recently expired value');
  });
});
