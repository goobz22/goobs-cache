import { set } from '../../../reusableStore';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, StringValue } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore', () => ({
  set: jest.requireActual('../../../ReusableStore').set,
}));

const logStream: WriteStream = createLogStream('set-invalid-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Set with Invalid Mode Tests', () => {
  const storeName = 'test-store';
  const identifier = 'test-identifier';
  const value: StringValue = { type: 'string', value: 'test value' };
  const expirationDate = new Date(Date.now() + 3600000); // 1 hour from now

  beforeAll(() => {
    log('Starting Set with Invalid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error when mode is an empty string', async () => {
    await expect(
      set(identifier, storeName, value, '' as CacheMode, expirationDate),
    ).rejects.toThrow('Invalid cache mode: ');

    log('Successfully rejected set operation with empty string mode');
  });

  it('should throw an error when mode is undefined', async () => {
    await expect(
      set(identifier, storeName, value, undefined as unknown as CacheMode, expirationDate),
    ).rejects.toThrow('Invalid cache mode: undefined');

    log('Successfully rejected set operation with undefined mode');
  });

  it('should throw an error when mode is null', async () => {
    await expect(
      set(identifier, storeName, value, null as unknown as CacheMode, expirationDate),
    ).rejects.toThrow('Invalid cache mode: null');

    log('Successfully rejected set operation with null mode');
  });

  it('should throw an error when mode is a number', async () => {
    await expect(
      set(identifier, storeName, value, 123 as unknown as CacheMode, expirationDate),
    ).rejects.toThrow('Invalid cache mode: 123');

    log('Successfully rejected set operation with number mode');
  });

  it('should throw an error when mode is a boolean', async () => {
    await expect(
      set(identifier, storeName, value, true as unknown as CacheMode, expirationDate),
    ).rejects.toThrow('Invalid cache mode: true');

    log('Successfully rejected set operation with boolean mode');
  });

  it('should throw an error when mode is an object', async () => {
    await expect(
      set(identifier, storeName, value, {} as unknown as CacheMode, expirationDate),
    ).rejects.toThrow('Invalid cache mode: [object Object]');

    log('Successfully rejected set operation with object mode');
  });

  it('should throw an error when mode is an invalid string', async () => {
    await expect(
      set(identifier, storeName, value, 'invalidMode' as CacheMode, expirationDate),
    ).rejects.toThrow('Invalid cache mode: invalidMode');

    log('Successfully rejected set operation with invalid string mode');
  });

  it('should not throw an error for valid cache modes', async () => {
    const validModes: CacheMode[] = ['server', 'client', 'cookie', 'twoLayer'];

    for (const mode of validModes) {
      await expect(set(identifier, storeName, value, mode, expirationDate)).resolves.not.toThrow();
    }

    log('Successfully accepted set operations with valid cache modes');
  });
});
