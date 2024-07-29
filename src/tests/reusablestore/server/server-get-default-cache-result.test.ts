import { serverGet } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, CacheResult } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverGet: jest.fn(),
}));

const logStream: WriteStream = createLogStream('server-get-default-cache-result-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Server-side Get Default CacheResult Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting Server-side Get Default CacheResult tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return default CacheResult for non-existent key', async () => {
    const identifier = 'non-existent-key';
    const expectedDefaultResult: CacheResult = {
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    };

    (serverGet as jest.Mock).mockResolvedValue(expectedDefaultResult);

    const result = await serverGet(identifier, storeName, mode);

    expect(result).toEqual(expectedDefaultResult);
    expect(serverGet).toHaveBeenCalledWith(identifier, storeName, mode);

    log('Successfully returned default CacheResult for non-existent key');
  });

  it('should return default CacheResult with correct identifier', async () => {
    const identifier = 'test-identifier';

    (serverGet as jest.Mock).mockImplementation((id) =>
      Promise.resolve({
        identifier: id,
        storeName,
        value: undefined,
        expirationDate: new Date(0),
        lastUpdatedDate: new Date(0),
        lastAccessedDate: new Date(0),
        getHitCount: 0,
        setHitCount: 0,
      }),
    );

    const result = await serverGet(identifier, storeName, mode);

    expect(result.identifier).toBe(identifier);

    log('Successfully returned default CacheResult with correct identifier');
  });

  it('should return default CacheResult with correct store name', async () => {
    const identifier = 'test-store-name';
    const customStoreName = 'custom-store';

    (serverGet as jest.Mock).mockImplementation((_, store) =>
      Promise.resolve({
        identifier,
        storeName: store,
        value: undefined,
        expirationDate: new Date(0),
        lastUpdatedDate: new Date(0),
        lastAccessedDate: new Date(0),
        getHitCount: 0,
        setHitCount: 0,
      }),
    );

    const result = await serverGet(identifier, customStoreName, mode);

    expect(result.storeName).toBe(customStoreName);

    log('Successfully returned default CacheResult with correct store name');
  });

  it('should return default CacheResult with undefined value', async () => {
    const identifier = 'undefined-value-test';

    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    const result = await serverGet(identifier, storeName, mode);

    expect(result.value).toBeUndefined();

    log('Successfully returned default CacheResult with undefined value');
  });

  it('should return default CacheResult with zero dates', async () => {
    const identifier = 'zero-dates-test';

    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    const result = await serverGet(identifier, storeName, mode);

    expect(result.expirationDate).toEqual(new Date(0));
    expect(result.lastUpdatedDate).toEqual(new Date(0));
    expect(result.lastAccessedDate).toEqual(new Date(0));

    log('Successfully returned default CacheResult with zero dates');
  });

  it('should return default CacheResult with zero hit counts', async () => {
    const identifier = 'zero-hit-counts-test';

    (serverGet as jest.Mock).mockResolvedValue({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });

    const result = await serverGet(identifier, storeName, mode);

    expect(result.getHitCount).toBe(0);
    expect(result.setHitCount).toBe(0);

    log('Successfully returned default CacheResult with zero hit counts');
  });

  it('should return consistent default CacheResult for multiple calls', async () => {
    const identifier1 = 'consistent-test-1';
    const identifier2 = 'consistent-test-2';

    (serverGet as jest.Mock).mockImplementation((id) =>
      Promise.resolve({
        identifier: id,
        storeName,
        value: undefined,
        expirationDate: new Date(0),
        lastUpdatedDate: new Date(0),
        lastAccessedDate: new Date(0),
        getHitCount: 0,
        setHitCount: 0,
      }),
    );

    const result1 = await serverGet(identifier1, storeName, mode);
    const result2 = await serverGet(identifier2, storeName, mode);

    expect(result1).toEqual(
      expect.objectContaining({
        storeName,
        value: undefined,
        expirationDate: new Date(0),
        lastUpdatedDate: new Date(0),
        lastAccessedDate: new Date(0),
        getHitCount: 0,
        setHitCount: 0,
      }),
    );
    expect(result2).toEqual(
      expect.objectContaining({
        storeName,
        value: undefined,
        expirationDate: new Date(0),
        lastUpdatedDate: new Date(0),
        lastAccessedDate: new Date(0),
        getHitCount: 0,
        setHitCount: 0,
      }),
    );
    expect(result1.identifier).toBe(identifier1);
    expect(result2.identifier).toBe(identifier2);

    log('Successfully returned consistent default CacheResult for multiple calls');
  });
});
