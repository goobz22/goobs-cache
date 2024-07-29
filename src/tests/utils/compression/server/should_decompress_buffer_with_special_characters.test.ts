import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('decompress-buffer-with-special-characters.log');
const log = createLogger(logStream);

describe('Decompression of Buffer with Special Characters', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should decompress a buffer with common special characters', async () => {
    const specialChars = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`';
    log('Testing decompression of buffer with common special characters');

    log('Compressing string with special characters');
    const compressed = await compressData(specialChars);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(specialChars);
    log('Decompression of buffer with common special characters successful');
  });

  it('should handle decompression of a buffer with Unicode special characters', async () => {
    const unicodeSpecialChars = '©®™℠℗℘℮⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞∫∮∯∰';
    log('Testing decompression of buffer with Unicode special characters');

    log('Compressing string with Unicode special characters');
    const compressed = await compressData(unicodeSpecialChars);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(unicodeSpecialChars);
    log('Decompression of buffer with Unicode special characters successful');
  });

  it('should decompress a buffer with escaped special characters', async () => {
    const escapedChars = '\\n\\t\\r\\\'\\"\\\\';
    log('Testing decompression of buffer with escaped special characters');

    log('Compressing string with escaped special characters');
    const compressed = await compressData(escapedChars);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(escapedChars);
    log('Decompression of buffer with escaped special characters successful');
  });

  it('should handle decompression of a buffer with control characters', async () => {
    const controlChars = '\0\b\t\n\v\f\r';
    log('Testing decompression of buffer with control characters');

    log('Compressing string with control characters');
    const compressed = await compressData(controlChars);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(controlChars);
    log('Decompression of buffer with control characters successful');
  });

  it('should decompress a buffer with a mix of special characters and normal text', async () => {
    const mixedString = 'Hello, World! 123 @#$%^&* αβγδε こんにちは";:?/';
    log('Testing decompression of buffer with mixed special characters and normal text');

    log('Compressing mixed string');
    const compressed = await compressData(mixedString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(mixedString);
    log('Decompression of buffer with mixed special characters and normal text successful');
  });

  it('should handle decompression of a buffer with emojis', async () => {
    const emojiString = '😀🙂🤔😊😎🚀⭐️🌈👍🏼👏👨‍👩‍👧‍👦';
    log('Testing decompression of buffer with emojis');

    log('Compressing string with emojis');
    const compressed = await compressData(emojiString);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(emojiString);
    log('Decompression of buffer with emojis successful');
  });

  it('should decompress a buffer with mathematical symbols', async () => {
    const mathSymbols = '∀∂∃∅∇∈∉∋∏∑−∕∗∙√∝∞∠∧∨∩∪∫∴∼≅≈≠≡≤≥⊂⊃⊄⊆⊇⊕⊗⊥⋅⌈⌉⌊⌋';
    log('Testing decompression of buffer with mathematical symbols');

    log('Compressing string with mathematical symbols');
    const compressed = await compressData(mathSymbols);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(mathSymbols);
    log('Decompression of buffer with mathematical symbols successful');
  });

  it('should handle decompression of a buffer with currency symbols', async () => {
    const currencySymbols = '$€£¥₩₪₱₿¢₡₢₣₤₥₦₧₨₩₪₫₭₮₯₰₱₲₳₴₵₶₷₸₹₺₻₼₽₾₿';
    log('Testing decompression of buffer with currency symbols');

    log('Compressing string with currency symbols');
    const compressed = await compressData(currencySymbols);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(currencySymbols);
    log('Decompression of buffer with currency symbols successful');
  });

  it('should decompress a buffer with a mix of all types of special characters', async () => {
    const mixedSpecialChars =
      '!@#$%^&* αβγδε こんにちは 😀🙂🤔 ∀∂∃∅∇∈ $€£¥₩ àáâãäå .,;:!? ASCII:\n |___|';
    log('Testing decompression of buffer with a mix of all types of special characters');

    log('Compressing mixed special characters string');
    const compressed = await compressData(mixedSpecialChars);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(mixedSpecialChars);
    log('Decompression of buffer with a mix of all types of special characters successful');
  });

  it('should handle decompression of a large buffer with repeated special characters', async () => {
    const repeatedSpecialChars = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`'.repeat(10000);
    log('Testing decompression of large buffer with repeated special characters');

    log('Compressing large string with repeated special characters');
    const compressed = await compressData(repeatedSpecialChars);
    log(`Original size: ${repeatedSpecialChars.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} characters`);

    expect(decompressed).toEqual(repeatedSpecialChars);
    log('Decompression of large buffer with repeated special characters successful');
  });
});
