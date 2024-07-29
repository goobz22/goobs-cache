import { serverSet, serverGet, loadConfig } from '../../../reusableStore.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverSet: jest.fn(),
  serverGet: jest.fn(),
  loadConfig: jest.fn().mockResolvedValue(mockCacheConfig),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(JSON.stringify(mockCacheConfig)),
}));

const logStream: WriteStream = createLogStream('initialize-server-cache-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Initialize Server Cache Tests', () => {
  const storeName = 'test-store';
  const mode: CacheMode = 'server';

  beforeAll(() => {
    log('Starting Initialize Server Cache tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize server cache on first operation', async () => {
    const identifier = 'init-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await serverSet(identifier, storeName, value, expirationDate, mode);

    expect(serverSet).toHaveBeenCalledTimes(1);
    expect(serverSet).toHaveBeenCalledWith(identifier, storeName, value, expirationDate, mode);

    log('Successfully initialized server cache on first operation');
  });

  it('should reuse initialized cache for subsequent operations', async () => {
    const identifier1 = 'reuse-test-1';
    const identifier2 = 'reuse-test-2';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await serverSet(identifier1, storeName, value, expirationDate, mode);
    await serverGet(identifier2, storeName, mode);

    expect(serverSet).toHaveBeenCalledTimes(1);
    expect(serverGet).toHaveBeenCalledTimes(1);

    log('Successfully reused initialized cache for subsequent operations');
  });

  it('should handle errors during cache initialization', async () => {
    (loadConfig as jest.Mock).mockRejectedValueOnce(new Error('Configuration error'));

    const identifier = 'error-init-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await expect(serverSet(identifier, storeName, value, expirationDate, mode)).rejects.toThrow(
      'Configuration error',
    );

    log('Successfully handled errors during cache initialization');
  });

  it('should load configuration during initialization', async () => {
    const identifier = 'config-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await serverSet(identifier, storeName, value, expirationDate, mode);

    expect(loadConfig).toHaveBeenCalled();

    log('Successfully loaded configuration during initialization');
  });

  it('should use encryption password from environment if available', async () => {
    const originalEnv = process.env.ENCRYPTION_PASSWORD;
    process.env.ENCRYPTION_PASSWORD = 'custom-password';

    const identifier = 'custom-password-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await serverSet(identifier, storeName, value, expirationDate, mode);

    expect(serverSet).toHaveBeenCalledWith(identifier, storeName, value, expirationDate, mode);

    process.env.ENCRYPTION_PASSWORD = originalEnv;
    log('Successfully used encryption password from environment');
  });

  it('should use default encryption password if not provided in environment', async () => {
    const originalEnv = process.env.ENCRYPTION_PASSWORD;
    delete process.env.ENCRYPTION_PASSWORD;

    const identifier = 'default-password-test';
    const value: StringValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 3600000);

    await serverSet(identifier, storeName, value, expirationDate, mode);

    expect(serverSet).toHaveBeenCalledWith(identifier, storeName, value, expirationDate, mode);

    process.env.ENCRYPTION_PASSWORD = originalEnv;
    log('Successfully used default encryption password when not provided in environment');
  });
});
