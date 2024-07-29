import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { TextEncoder, TextDecoder } from 'util';

const logStream: WriteStream = createLogStream('compress-decompress-character-encodings.log');
const log = createLogger(logStream);

describe('Compression and Decompression with Different Character Encodings', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const encodings = ['utf-8', 'utf-16le', 'ascii', 'iso-8859-1'] as const;

  encodings.forEach((encoding) => {
    it(`should compress and decompress correctly with ${encoding} encoding`, async () => {
      const originalData = 'Hello, 世界! ¡Hola, мир! こんにちは、世界！';
      log(`Testing with ${encoding} encoding`);

      const encoder = new TextEncoder();
      const decoder = new TextDecoder(encoding);

      // Encode the original data
      const encodedData = encoder.encode(originalData);
      const encodedString = decoder.decode(encodedData);

      log('Compressing encoded data');
      const compressed = await compressData(encodedString);
      log(`Compressed size: ${compressed.length} bytes`);

      log('Decompressing data');
      const decompressed = await decompressData(compressed);
      log(`Decompressed size: ${decompressed.length} characters`);

      // Decode the decompressed data
      const decodedData = encoder.encode(decompressed);
      const result = decoder.decode(decodedData);

      expect(result).toEqual(originalData);
      log(`Compression and decompression successful with ${encoding} encoding`);
    });
  });

  it('should handle emoji and other special characters', async () => {
    const dataWithEmoji = '😀🌍🚀 Special characters test: áéíóú ñÑ ¿¡';
    log('Testing with emoji and special characters');

    log('Compressing data with emoji');
    const compressed = await compressData(dataWithEmoji);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(dataWithEmoji);
    log('Compression and decompression successful with emoji and special characters');
  });
});
