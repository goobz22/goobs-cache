import { serverSet, serverGet, serverRemove } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue, CacheResult } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.fn(),
  serverGet: jest.fn(),
  serverRemove: jest.fn(),
}));

const logStream: WriteStream = createLogStream('reusable-store-server-basic-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('ReusableStore Server Basic Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting ReusableStore Server Basic tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('serverSet', () => {
    it('should set a value successfully', async () => {
      const identifier = 'set-test';
      const value: StringValue = { type: 'string', value: 'test value' };
      const expirationDate = new Date(Date.now() + 3600000);

      (serverSet as jest.Mock).mockResolvedValue(undefined);

      await expect(
        serverSet(identifier, storeName, value, expirationDate, mode),
      ).resolves.not.toThrow();

      expect(serverSet).toHaveBeenCalledWith(identifier, storeName, value, expirationDate, mode);
      log('Successfully set a value');
    });
  });

  describe('serverGet', () => {
    it('should get a value successfully', async () => {
      const identifier = 'get-test';
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
      log('Successfully got a value');
    });

    it('should return default CacheResult for non-existent key', async () => {
      const identifier = 'non-existent';
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
  });

  describe('serverRemove', () => {
    it('should remove a value successfully', async () => {
      const identifier = 'remove-test';

      (serverRemove as jest.Mock).mockResolvedValue(undefined);

      await expect(serverRemove(identifier, storeName, mode)).resolves.not.toThrow();

      expect(serverRemove).toHaveBeenCalledWith(identifier, storeName, mode);
      log('Successfully removed a value');
    });
  });

  it('should handle a basic set-get-remove cycle', async () => {
    const identifier = 'cycle-test';
    const value: StringValue = { type: 'string', value: 'cycle test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    // Set
    (serverSet as jest.Mock).mockResolvedValue(undefined);
    await serverSet(identifier, storeName, value, expirationDate, mode);

    // Get
    const mockResult: CacheResult = {
      identifier,
      storeName,
      value,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };
    (serverGet as jest.Mock).mockResolvedValue(mockResult);
    const getResult = await serverGet(identifier, storeName, mode);
    expect(getResult).toEqual(mockResult);

    // Remove
    (serverRemove as jest.Mock).mockResolvedValue(undefined);
    await serverRemove(identifier, storeName, mode);

    // Verify removal
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
    const finalResult = await serverGet(identifier, storeName, mode);
    expect(finalResult).toEqual(defaultResult);

    log('Successfully handled a basic set-get-remove cycle');
  });
});
