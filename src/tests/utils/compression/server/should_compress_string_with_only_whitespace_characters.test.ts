import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-whitespace-string.log');
const log = createLogger(logStream);

describe('Compression of String with Only Whitespace Characters', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress a string with only space characters', async () => {
    const spaceString = '    '.repeat(1000);
    log('Testing compression of string with only space characters');

    log('Compressing space string');
    const compressed = await compressData(spaceString);
    log(`Original size: ${spaceString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(spaceString);
    log('Compression and decompression of space string successful');
  });

  it('should handle compression of a string with only tab characters', async () => {
    const tabString = '\t\t\t\t'.repeat(1000);
    log('Testing compression of string with only tab characters');

    log('Compressing tab string');
    const compressed = await compressData(tabString);
    log(`Original size: ${tabString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(tabString);
    log('Compression and decompression of tab string successful');
  });

  it('should compress a string with only newline characters', async () => {
    const newlineString = '\n\n\n\n'.repeat(1000);
    log('Testing compression of string with only newline characters');

    log('Compressing newline string');
    const compressed = await compressData(newlineString);
    log(`Original size: ${newlineString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(newlineString);
    log('Compression and decompression of newline string successful');
  });

  it('should handle compression of a string with mixed whitespace characters', async () => {
    const mixedWhitespaceString = ' \t\n\r'.repeat(1000);
    log('Testing compression of string with mixed whitespace characters');

    log('Compressing mixed whitespace string');
    const compressed = await compressData(mixedWhitespaceString);
    log(`Original size: ${mixedWhitespaceString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(mixedWhitespaceString);
    log('Compression and decompression of mixed whitespace string successful');
  });

  it('should compress a large string of only whitespace characters', async () => {
    const largeWhitespaceString = ' '.repeat(1000000);
    log('Testing compression of large string with only whitespace characters');

    log('Compressing large whitespace string');
    const compressed = await compressData(largeWhitespaceString);
    log(`Original size: ${largeWhitespaceString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(largeWhitespaceString);
    log('Compression and decompression of large whitespace string successful');
  });

  it('should handle compression of a string with non-breaking spaces', async () => {
    const nonBreakingSpaceString = '\u00A0\u00A0\u00A0\u00A0'.repeat(1000);
    log('Testing compression of string with non-breaking spaces');

    log('Compressing non-breaking space string');
    const compressed = await compressData(nonBreakingSpaceString);
    log(`Original size: ${Buffer.byteLength(nonBreakingSpaceString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(nonBreakingSpaceString);
    log('Compression and decompression of non-breaking space string successful');
  });

  it('should compress a string with various Unicode whitespace characters', async () => {
    const unicodeWhitespaceString =
      '\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000'.repeat(
        100,
      );
    log('Testing compression of string with various Unicode whitespace characters');

    log('Compressing Unicode whitespace string');
    const compressed = await compressData(unicodeWhitespaceString);
    log(`Original size: ${Buffer.byteLength(unicodeWhitespaceString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(unicodeWhitespaceString);
    log('Compression and decompression of Unicode whitespace string successful');
  });

  it('should handle compression of an empty string', async () => {
    const emptyString = '';
    log('Testing compression of empty string');

    log('Compressing empty string');
    const compressed = await compressData(emptyString);
    log(`Original size: ${emptyString.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(emptyString);
    log('Compression and decompression of empty string successful');
  });
});
