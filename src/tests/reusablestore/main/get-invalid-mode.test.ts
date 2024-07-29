import { get } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  get: jest.requireActual('../../../ReusableStore').get,
}));

const logStream: WriteStream = createLogStream('get-invalid-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Get with Invalid Mode Tests', () => {
  const storeName = 'test-store';
  const identifier = 'test-identifier';

  beforeAll(() => {
    log('Starting Get with Invalid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error when mode is an empty string', async () => {
    await expect(get(identifier, storeName, '' as CacheMode)).rejects.toThrow(
      'Invalid cache mode: ',
    );

    log('Successfully rejected get operation with empty string mode');
  });

  it('should throw an error when mode is undefined', async () => {
    await expect(get(identifier, storeName, undefined as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode: undefined',
    );

    log('Successfully rejected get operation with undefined mode');
  });

  it('should throw an error when mode is null', async () => {
    await expect(get(identifier, storeName, null as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode: null',
    );

    log('Successfully rejected get operation with null mode');
  });

  it('should throw an error when mode is a number', async () => {
    await expect(get(identifier, storeName, 123 as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode: 123',
    );

    log('Successfully rejected get operation with number mode');
  });

  it('should throw an error when mode is a boolean', async () => {
    await expect(get(identifier, storeName, true as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode: true',
    );

    log('Successfully rejected get operation with boolean mode');
  });

  it('should throw an error when mode is an object', async () => {
    await expect(get(identifier, storeName, {} as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode: [object Object]',
    );

    log('Successfully rejected get operation with object mode');
  });

  it('should throw an error when mode is an invalid string', async () => {
    await expect(get(identifier, storeName, 'invalidMode' as CacheMode)).rejects.toThrow(
      'Invalid cache mode: invalidMode',
    );

    log('Successfully rejected get operation with invalid string mode');
  });

  it('should not throw an error for valid cache modes', async () => {
    const validModes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

    for (const mode of validModes) {
      await expect(get(identifier, storeName, mode)).resolves.not.toThrow();
    }

    log('Successfully accepted get operations with valid cache modes');
  });

  it('should throw an error when identifier is empty', async () => {
    await expect(get('', storeName, 'server')).rejects.toThrow('Invalid identifier');

    log('Successfully rejected get operation with empty identifier');
  });

  it('should throw an error when storeName is empty', async () => {
    await expect(get(identifier, '', 'server')).rejects.toThrow('Invalid store name');

    log('Successfully rejected get operation with empty store name');
  });

  it('should handle errors consistently across invalid inputs', async () => {
    const invalidInputs = [
      { identifier: '', storeName: 'valid', mode: 'server' as CacheMode },
      { identifier: 'valid', storeName: '', mode: 'server' as CacheMode },
      { identifier: 'valid', storeName: 'valid', mode: 'invalid' as CacheMode },
    ];

    for (const input of invalidInputs) {
      await expect(get(input.identifier, input.storeName, input.mode)).rejects.toThrow();
    }

    log('Successfully handled errors consistently across invalid inputs');
  });
});
