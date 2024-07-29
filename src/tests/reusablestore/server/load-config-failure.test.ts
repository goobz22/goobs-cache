import { loadConfig } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { WriteStream } from 'fs';
import path from 'path';
import fs from 'fs/promises';

jest.mock('fs/promises');
jest.mock('../../../ReusableStore.server', () => ({
  loadConfig: jest.requireActual('../../../ReusableStore.server').loadConfig,
}));

const logStream: WriteStream = createLogStream('load-config-failure-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Load Config Failure Tests', () => {
  beforeAll(() => {
    log('Starting Load Config Failure tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error when the configuration file is not found', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT: no such file or directory'));

    await expect(loadConfig()).rejects.toThrow('Failed to load configuration');

    expect(fs.readFile).toHaveBeenCalledWith(
      path.resolve(process.cwd(), '.reusablestore.json'),
      'utf-8',
    );

    log('Successfully handled file not found error');
  });

  it('should throw an error when the configuration file contains invalid JSON', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue('{ invalid json }');

    await expect(loadConfig()).rejects.toThrow('Failed to load configuration');

    log('Successfully handled invalid JSON error');
  });

  it('should throw an error when the configuration file is empty', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue('');

    await expect(loadConfig()).rejects.toThrow('Failed to load configuration');

    log('Successfully handled empty file error');
  });

  it('should throw an error when there is a permission issue', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('EACCES: permission denied'));

    await expect(loadConfig()).rejects.toThrow('Failed to load configuration');

    log('Successfully handled permission error');
  });

  it('should throw an error when there is a network issue (for network file systems)', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENETDOWN: network is down'));

    await expect(loadConfig()).rejects.toThrow('Failed to load configuration');

    log('Successfully handled network error');
  });

  it('should throw an error when the file is too large', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('EFBIG: file too large'));

    await expect(loadConfig()).rejects.toThrow('Failed to load configuration');

    log('Successfully handled file too large error');
  });

  it('should throw an error when there is insufficient memory', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOMEM: not enough memory'));

    await expect(loadConfig()).rejects.toThrow('Failed to load configuration');

    log('Successfully handled insufficient memory error');
  });

  it('should throw an error when the configuration is not an object', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify('not an object'));

    await expect(loadConfig()).rejects.toThrow('Failed to load configuration');

    log('Successfully handled non-object configuration error');
  });

  it('should throw an error when required fields are missing', async () => {
    const incompleteConfig = {
      cacheSize: 100,
      // Missing other required fields
    };

    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(incompleteConfig));

    await expect(loadConfig()).rejects.toThrow('Failed to load configuration');

    log('Successfully handled missing required fields error');
  });

  it('should throw an error when fields have invalid types', async () => {
    const invalidConfig = {
      cacheSize: 'not a number',
      cacheMaxAge: 3600000,
      persistenceInterval: 5000,
      maxMemoryUsage: 1024 * 1024,
      evictionPolicy: 'invalid',
      prefetchThreshold: 0.8,
      compressionLevel: 1,
      algorithm: 'aes-256-gcm',
      keySize: 256,
      batchSize: 10,
      autoTuneInterval: 3600000,
      keyCheckIntervalMs: 3600000,
      keyRotationIntervalMs: 86400000,
      forceReset: false,
      encryptionPassword: 'testPassword',
    };

    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

    await expect(loadConfig()).rejects.toThrow('Failed to load configuration');

    log('Successfully handled invalid field types error');
  });
});
