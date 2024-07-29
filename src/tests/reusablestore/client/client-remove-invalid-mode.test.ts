import { clientRemove } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('client-remove-invalid-mode-test.log');
const log = createLogger(logStream);

describe('Client Remove Invalid Mode Tests', () => {
  const identifier = 'test-id';
  const storeName = 'test-store';

  beforeAll(() => {
    log('Starting Client Remove Invalid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error for an invalid mode', async () => {
    const invalidMode = 'invalid' as CacheMode;

    await expect(clientRemove(identifier, storeName, invalidMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for invalid mode');
  });

  it('should throw an error for an empty mode string', async () => {
    const emptyMode = '' as CacheMode;

    await expect(clientRemove(identifier, storeName, emptyMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for empty mode string');
  });

  it('should throw an error for undefined mode', async () => {
    const undefinedMode = undefined as unknown as CacheMode;

    await expect(clientRemove(identifier, storeName, undefinedMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for undefined mode');
  });

  it('should throw an error for null mode', async () => {
    const nullMode = null as unknown as CacheMode;

    await expect(clientRemove(identifier, storeName, nullMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for null mode');
  });

  it('should throw an error for numeric mode', async () => {
    const numericMode = 123 as unknown as CacheMode;

    await expect(clientRemove(identifier, storeName, numericMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for numeric mode');
  });

  it('should throw an error for object mode', async () => {
    const objectMode = {} as unknown as CacheMode;

    await expect(clientRemove(identifier, storeName, objectMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for object mode');
  });

  it('should throw an error for array mode', async () => {
    const arrayMode = [] as unknown as CacheMode;

    await expect(clientRemove(identifier, storeName, arrayMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for array mode');
  });

  it('should throw an error for boolean mode', async () => {
    const booleanMode = true as unknown as CacheMode;

    await expect(clientRemove(identifier, storeName, booleanMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for boolean mode');
  });

  it('should throw an error for symbol mode', async () => {
    const symbolMode = Symbol('mode') as unknown as CacheMode;

    await expect(clientRemove(identifier, storeName, symbolMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for symbol mode');
  });

  it('should throw an error for function mode', async () => {
    const functionMode = (() => {}) as unknown as CacheMode;

    await expect(clientRemove(identifier, storeName, functionMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for function mode');
  });

  it('should throw an error for mode with extra whitespace', async () => {
    const whitespaceMode = '  client  ' as CacheMode;

    await expect(clientRemove(identifier, storeName, whitespaceMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for mode with extra whitespace');
  });

  it('should throw an error for mode with incorrect capitalization', async () => {
    const capitalizedMode = 'Client' as CacheMode;

    await expect(clientRemove(identifier, storeName, capitalizedMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for mode with incorrect capitalization');
  });
});
