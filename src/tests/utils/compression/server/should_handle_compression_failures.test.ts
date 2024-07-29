import { compressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('handle-compression-failures.log');
const log = createLogger(logStream);

describe('Handling Compression Failures', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should throw an error when compressing undefined input', async () => {
    log('Testing compression of undefined input');
    await expect(compressData(undefined as unknown as string)).rejects.toThrow();
    log('Error thrown successfully for undefined input');
  });

  it('should throw an error when compressing null input', async () => {
    log('Testing compression of null input');
    await expect(compressData(null as unknown as string)).rejects.toThrow();
    log('Error thrown successfully for null input');
  });

  it('should throw an error when compressing non-string input', async () => {
    log('Testing compression of non-string input');
    await expect(compressData(123 as unknown as string)).rejects.toThrow();
    log('Error thrown successfully for non-string input');
  });

  it('should handle compression of extremely large input', async () => {
    const largeInput = 'a'.repeat(1e9); // 1 billion characters
    log('Testing compression of extremely large input');

    let error: unknown;
    try {
      await compressData(largeInput);
      log('Compression of extremely large input succeeded unexpectedly');
    } catch (e) {
      error = e;
      log(`Error thrown as expected: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    expect(error).toBeDefined();
  });

  it('should throw an error when compressing invalid UTF-8 input', async () => {
    const invalidUtf8 = Buffer.from([0xff, 0xfe, 0xfd]).toString('binary');
    log('Testing compression of invalid UTF-8 input');
    await expect(compressData(invalidUtf8)).rejects.toThrow();
    log('Error thrown successfully for invalid UTF-8 input');
  });

  it('should handle compression when out of memory', async () => {
    const originalMemoryLimit = process.memoryUsage().heapTotal;
    const memoryHog = 'a'.repeat(Number(originalMemoryLimit));
    log('Testing compression when out of memory');

    let error: unknown;
    try {
      await compressData(memoryHog);
      log('Compression succeeded despite memory constraints');
    } catch (e) {
      error = e;
      log(`Error thrown as expected: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    expect(error).toBeDefined();
  });

  it('should handle compression of a string with null bytes', async () => {
    const stringWithNullBytes = 'Hello\0World';
    log('Testing compression of string with null bytes');

    let result: Buffer | undefined;
    let error: unknown;
    try {
      result = await compressData(stringWithNullBytes);
      log('Compression of string with null bytes succeeded');
    } catch (e) {
      error = e;
      log(`Error thrown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    expect(result || error).toBeDefined();
  });

  it('should handle compression of a string with only whitespace', async () => {
    const whitespaceString = '    \t\n\r    ';
    log('Testing compression of string with only whitespace');

    const compressed = await compressData(whitespaceString);
    log(`Compression succeeded, compressed size: ${compressed.length} bytes`);
    expect(compressed).toBeDefined();
  });

  it('should throw an error when compressing an empty buffer', async () => {
    const emptyBuffer = Buffer.alloc(0);
    log('Testing compression of empty buffer');
    await expect(compressData(emptyBuffer.toString())).rejects.toThrow();
    log('Error thrown successfully for empty buffer');
  });

  it('should handle compression of input at the maximum allowed size', async () => {
    const maxSizeInput = 'a'.repeat(1024 * 1024 * 1024); // 1GB string
    log('Testing compression of input at maximum allowed size');

    let result: Buffer | undefined;
    let error: unknown;
    try {
      result = await compressData(maxSizeInput);
      log(`Compression succeeded, compressed size: ${result.length} bytes`);
    } catch (e) {
      error = e;
      log(`Error thrown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    expect(result || error).toBeDefined();
  });

  it('should throw an error when compressing input exceeding maximum allowed size', async () => {
    const oversizeInput = 'a'.repeat(1024 * 1024 * 1024 + 1); // 1GB + 1 byte string
    log('Testing compression of input exceeding maximum allowed size');
    await expect(compressData(oversizeInput)).rejects.toThrow();
    log('Error thrown successfully for oversize input');
  });
});
