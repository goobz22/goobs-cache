import { clientGet } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode } from '../../../types';

jest.mock('../../../ReusableStore.client');

const logStream = createLogStream('client-get-invalid-mode-test.log');
const log = createLogger(logStream);

describe('Client Get Invalid Mode Tests', () => {
  const identifier = 'test-id';
  const storeName = 'test-store';

  beforeAll(() => {
    log('Starting Client Get Invalid Mode tests...');
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

    await expect(clientGet(identifier, storeName, invalidMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for invalid mode');
  });

  it('should throw an error for an empty mode string', async () => {
    const emptyMode = '' as CacheMode;

    await expect(clientGet(identifier, storeName, emptyMode)).rejects.toThrow('Invalid cache mode');
    log('Successfully threw error for empty mode string');
  });

  it('should throw an error for undefined mode', async () => {
    const undefinedMode = undefined as unknown as CacheMode;

    await expect(clientGet(identifier, storeName, undefinedMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for undefined mode');
  });

  it('should throw an error for null mode', async () => {
    const nullMode = null as unknown as CacheMode;

    await expect(clientGet(identifier, storeName, nullMode)).rejects.toThrow('Invalid cache mode');
    log('Successfully threw error for null mode');
  });

  it('should throw an error for numeric mode', async () => {
    const numericMode = 123 as unknown as CacheMode;

    await expect(clientGet(identifier, storeName, numericMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for numeric mode');
  });

  it('should throw an error for object mode', async () => {
    const objectMode = {} as unknown as CacheMode;

    await expect(clientGet(identifier, storeName, objectMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for object mode');
  });

  it('should throw an error for array mode', async () => {
    const arrayMode = [] as unknown as CacheMode;

    await expect(clientGet(identifier, storeName, arrayMode)).rejects.toThrow('Invalid cache mode');
    log('Successfully threw error for array mode');
  });

  it('should throw an error for boolean mode', async () => {
    const booleanMode = true as unknown as CacheMode;

    await expect(clientGet(identifier, storeName, booleanMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for boolean mode');
  });

  it('should throw an error for symbol mode', async () => {
    const symbolMode = Symbol('mode') as unknown as CacheMode;

    await expect(clientGet(identifier, storeName, symbolMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for symbol mode');
  });

  it('should throw an error for function mode', async () => {
    const functionMode = (() => {}) as unknown as CacheMode;

    await expect(clientGet(identifier, storeName, functionMode)).rejects.toThrow(
      'Invalid cache mode',
    );
    log('Successfully threw error for function mode');
  });
});
