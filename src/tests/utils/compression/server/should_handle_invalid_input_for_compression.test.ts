import { compressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('handle-invalid-input-compression.log');
const log = createLogger(logStream);

describe('Handling Invalid Input for Compression', () => {
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

  it('should throw an error when compressing number input', async () => {
    log('Testing compression of number input');
    await expect(compressData(123 as unknown as string)).rejects.toThrow();
    log('Error thrown successfully for number input');
  });

  it('should throw an error when compressing boolean input', async () => {
    log('Testing compression of boolean input');
    await expect(compressData(true as unknown as string)).rejects.toThrow();
    log('Error thrown successfully for boolean input');
  });

  it('should throw an error when compressing object input', async () => {
    log('Testing compression of object input');
    await expect(compressData({ key: 'value' } as unknown as string)).rejects.toThrow();
    log('Error thrown successfully for object input');
  });

  it('should throw an error when compressing array input', async () => {
    log('Testing compression of array input');
    await expect(compressData([1, 2, 3] as unknown as string)).rejects.toThrow();
    log('Error thrown successfully for array input');
  });

  it('should throw an error when compressing function input', async () => {
    log('Testing compression of function input');
    await expect(compressData((() => {}) as unknown as string)).rejects.toThrow();
    log('Error thrown successfully for function input');
  });

  it('should throw an error when compressing symbol input', async () => {
    log('Testing compression of symbol input');
    await expect(compressData(Symbol('test') as unknown as string)).rejects.toThrow();
    log('Error thrown successfully for symbol input');
  });

  it('should throw an error when compressing BigInt input', async () => {
    log('Testing compression of BigInt input');
    await expect(compressData(BigInt(123) as unknown as string)).rejects.toThrow();
    log('Error thrown successfully for BigInt input');
  });

  it('should throw an error when compressing empty string input', async () => {
    log('Testing compression of empty string input');
    await expect(compressData('')).rejects.toThrow();
    log('Error thrown successfully for empty string input');
  });

  it('should throw an error when compressing string with only whitespace', async () => {
    log('Testing compression of string with only whitespace');
    await expect(compressData('   \t\n')).rejects.toThrow();
    log('Error thrown successfully for string with only whitespace');
  });

  it('should throw an error when compressing extremely large string', async () => {
    log('Testing compression of extremely large string');
    const largeString = 'a'.repeat(1e9); // 1 billion characters
    await expect(compressData(largeString)).rejects.toThrow();
    log('Error thrown successfully for extremely large string');
  });

  it('should throw an error when compressing string with null bytes', async () => {
    log('Testing compression of string with null bytes');
    const stringWithNullBytes = 'Hello\0World';
    await expect(compressData(stringWithNullBytes)).rejects.toThrow();
    log('Error thrown successfully for string with null bytes');
  });

  it('should throw an error when compressing string with invalid UTF-8 sequences', async () => {
    log('Testing compression of string with invalid UTF-8 sequences');
    const invalidUtf8 = Buffer.from([0xff, 0xfe, 0xfd]).toString('binary');
    await expect(compressData(invalidUtf8)).rejects.toThrow();
    log('Error thrown successfully for string with invalid UTF-8 sequences');
  });

  it('should throw an error when compressing with insufficient memory', async () => {
    log('Testing compression with insufficient memory');
    const originalMemoryLimit = process.memoryUsage().heapTotal;
    const memoryHog = 'a'.repeat(Number(originalMemoryLimit));
    await expect(compressData(memoryHog)).rejects.toThrow();
    log('Error thrown successfully for insufficient memory');
  });
});
