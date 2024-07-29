import { serverRemove } from '../../../reusableStore.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode } from '../../../types';
import { WriteStream } from 'fs';

jest.mock('../../../ReusableStore.server', () => ({
  serverRemove: jest.requireActual('../../../ReusableStore.server').serverRemove,
}));

const logStream: WriteStream = createLogStream('server-remove-invalid-mode-test.log');
const log: (message: string) => void = createLogger(logStream);

describe('Server-side Remove with Invalid Mode Tests', () => {
  const storeName = 'test-store';
  const invalidModes: CacheMode[] = ['client', 'cookie', 'twoLayer'];

  beforeAll(() => {
    log('Starting Server-side Remove with Invalid Mode tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(invalidModes)('should throw an error when mode is %s', async (invalidMode) => {
    const identifier = 'invalid-mode-test';

    await expect(serverRemove(identifier, storeName, invalidMode)).rejects.toThrow(
      `Invalid cache mode for server-side caching: ${invalidMode}`,
    );

    log(`Successfully rejected remove operation with invalid mode: ${invalidMode}`);
  });

  it('should throw an error when mode is undefined', async () => {
    const identifier = 'undefined-mode-test';

    await expect(
      serverRemove(identifier, storeName, undefined as unknown as CacheMode),
    ).rejects.toThrow('Invalid cache mode for server-side caching: undefined');

    log('Successfully rejected remove operation with undefined mode');
  });

  it('should throw an error when mode is null', async () => {
    const identifier = 'null-mode-test';

    await expect(serverRemove(identifier, storeName, null as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode for server-side caching: null',
    );

    log('Successfully rejected remove operation with null mode');
  });

  it('should throw an error when mode is an empty string', async () => {
    const identifier = 'empty-string-mode-test';

    await expect(serverRemove(identifier, storeName, '' as CacheMode)).rejects.toThrow(
      'Invalid cache mode for server-side caching: ',
    );

    log('Successfully rejected remove operation with empty string mode');
  });

  it('should throw an error when mode is a non-CacheMode string', async () => {
    const identifier = 'invalid-string-mode-test';

    await expect(serverRemove(identifier, storeName, 'invalidMode' as CacheMode)).rejects.toThrow(
      'Invalid cache mode for server-side caching: invalidMode',
    );

    log('Successfully rejected remove operation with invalid string mode');
  });

  it('should throw an error when mode is a number', async () => {
    const identifier = 'number-mode-test';

    await expect(serverRemove(identifier, storeName, 123 as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode for server-side caching: 123',
    );

    log('Successfully rejected remove operation with number mode');
  });

  it('should throw an error when mode is a boolean', async () => {
    const identifier = 'boolean-mode-test';

    await expect(serverRemove(identifier, storeName, true as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode for server-side caching: true',
    );

    log('Successfully rejected remove operation with boolean mode');
  });

  it('should throw an error when mode is an object', async () => {
    const identifier = 'object-mode-test';

    await expect(serverRemove(identifier, storeName, {} as unknown as CacheMode)).rejects.toThrow(
      'Invalid cache mode for server-side caching: [object Object]',
    );

    log('Successfully rejected remove operation with object mode');
  });
});
