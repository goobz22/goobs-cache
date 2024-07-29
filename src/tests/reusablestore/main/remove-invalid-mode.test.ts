import { remove } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  remove: jest.requireActual('../../../ReusableStore').remove,
}));

const logStream: WriteStream = createLogStream('remove-invalid-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Remove with Invalid Mode Tests', () => {
  const storeName = 'test-store';
  const identifier = 'test-identifier';

  beforeAll(() => {
    log('Starting Remove with Invalid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error when mode is an empty string', async () => {
    await expect(remove(identifier, storeName, '' as CacheMode)).rejects.toThrow(
      'Invalid cache mode: ',
    );

    log('Successfully rejected remove operation with empty string mode');
  });

  it('should throw an error when mode is undefined', async () => {
    await expect(remove(identifier, storeName, undefined as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode: undefined',
    );

    log('Successfully rejected remove operation with undefined mode');
  });

  it('should throw an error when mode is null', async () => {
    await expect(remove(identifier, storeName, null as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode: null',
    );

    log('Successfully rejected remove operation with null mode');
  });

  it('should throw an error when mode is a number', async () => {
    await expect(remove(identifier, storeName, 123 as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode: 123',
    );

    log('Successfully rejected remove operation with number mode');
  });

  it('should throw an error when mode is a boolean', async () => {
    await expect(remove(identifier, storeName, true as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode: true',
    );

    log('Successfully rejected remove operation with boolean mode');
  });

  it('should throw an error when mode is an object', async () => {
    await expect(remove(identifier, storeName, {} as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode: [object Object]',
    );

    log('Successfully rejected remove operation with object mode');
  });

  it('should throw an error when mode is an invalid string', async () => {
    await expect(remove(identifier, storeName, 'invalidMode' as CacheMode)).rejects.toThrow(
      'Invalid cache mode: invalidMode',
    );

    log('Successfully rejected remove operation with invalid string mode');
  });

  it('should not throw an error for valid cache modes', async () => {
    const validModes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

    for (const mode of validModes) {
      await expect(remove(identifier, storeName, mode)).resolves.not.toThrow();
    }

    log('Successfully accepted remove operations with valid cache modes');
  });
});
