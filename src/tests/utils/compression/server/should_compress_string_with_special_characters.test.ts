import { compressData, decompressData } from '../../../../utils/compression.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';
import { WriteStream } from 'fs';

const logStream: WriteStream = createLogStream('compress-string-with-special-characters.log');
const log = createLogger(logStream);

describe('Compression of String with Special Characters', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should compress and decompress a string with common special characters', async () => {
    const specialChars = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`';
    log('Testing compression of string with common special characters');

    log('Compressing string with special characters');
    const compressed = await compressData(specialChars);
    log(`Original size: ${specialChars.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(specialChars);
    log('Compression and decompression of string with common special characters successful');
  });

  it('should handle compression of a string with Unicode special characters', async () => {
    const unicodeSpecialChars = '©®™℠℗℘℮⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞∫∮∯∰';
    log('Testing compression of string with Unicode special characters');

    log('Compressing string with Unicode special characters');
    const compressed = await compressData(unicodeSpecialChars);
    log(`Original size: ${Buffer.byteLength(unicodeSpecialChars)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(unicodeSpecialChars);
    log('Compression and decompression of string with Unicode special characters successful');
  });

  it('should compress a string with escaped special characters', async () => {
    const escapedChars = '\\n\\t\\r\\\'\\"\\\\';
    log('Testing compression of string with escaped special characters');

    log('Compressing string with escaped special characters');
    const compressed = await compressData(escapedChars);
    log(`Original size: ${escapedChars.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(escapedChars);
    log('Compression and decompression of string with escaped special characters successful');
  });

  it('should handle compression of a string with control characters', async () => {
    const controlChars = '\0\b\t\n\v\f\r';
    log('Testing compression of string with control characters');

    log('Compressing string with control characters');
    const compressed = await compressData(controlChars);
    log(`Original size: ${controlChars.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(controlChars);
    log('Compression and decompression of string with control characters successful');
  });

  it('should compress a string with a mix of special characters and normal text', async () => {
    const mixedString = 'Hello, World! 123 @#$%^&* αβγδε こんにちは";:?/';
    log('Testing compression of string with mixed special characters and normal text');

    log('Compressing mixed string');
    const compressed = await compressData(mixedString);
    log(`Original size: ${Buffer.byteLength(mixedString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(mixedString);
    log('Compression and decompression of mixed string successful');
  });

  it('should handle compression of a string with emojis', async () => {
    const emojiString = '😀🙂🤔😊😎🚀⭐️🌈👍🏼👏👨‍👩‍👧‍👦';
    log('Testing compression of string with emojis');

    log('Compressing string with emojis');
    const compressed = await compressData(emojiString);
    log(`Original size: ${Buffer.byteLength(emojiString)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(emojiString);
    log('Compression and decompression of string with emojis successful');
  });

  it('should compress a large string with repeated special characters', async () => {
    const repeatedSpecialChars = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`'.repeat(10000);
    log('Testing compression of large string with repeated special characters');

    log('Compressing large string with repeated special characters');
    const compressed = await compressData(repeatedSpecialChars);
    log(`Original size: ${repeatedSpecialChars.length} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${decompressed.length} bytes`);

    expect(decompressed).toEqual(repeatedSpecialChars);
    log(
      'Compression and decompression of large string with repeated special characters successful',
    );
  });

  it('should handle compression of a string with mathematical symbols', async () => {
    const mathSymbols = '∀∂∃∅∇∈∉∋∏∑−∕∗∙√∝∞∠∧∨∩∪∫∴∼≅≈≠≡≤≥⊂⊃⊄⊆⊇⊕⊗⊥⋅⌈⌉⌊⌋';
    log('Testing compression of string with mathematical symbols');

    log('Compressing string with mathematical symbols');
    const compressed = await compressData(mathSymbols);
    log(`Original size: ${Buffer.byteLength(mathSymbols)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(mathSymbols);
    log('Compression and decompression of string with mathematical symbols successful');
  });

  it('should compress a string with currency symbols', async () => {
    const currencySymbols = '$€£¥₩₪₱₿¢₡₢₣₤₥₦₧₨₩₪₫₭₮₯₰₱₲₳₴₵₶₷₸₹₺₻₼₽₾₿';
    log('Testing compression of string with currency symbols');

    log('Compressing string with currency symbols');
    const compressed = await compressData(currencySymbols);
    log(`Original size: ${Buffer.byteLength(currencySymbols)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(currencySymbols);
    log('Compression and decompression of string with currency symbols successful');
  });

  it('should handle compression of a string with diacritical marks', async () => {
    const diacriticalMarks =
      'àáâãäåāăąÀÁÂÃÄÅĀĂĄèéêëēĕėęěÈÉÊËĒĔĖĘĚìíîïìĩīĭÌÍÎÏÌĨĪĬòóôõöōŏőÒÓÔÕÖŌŎŐùúûüũūŭůÙÚÛÜŨŪŬŮ';
    log('Testing compression of string with diacritical marks');

    log('Compressing string with diacritical marks');
    const compressed = await compressData(diacriticalMarks);
    log(`Original size: ${Buffer.byteLength(diacriticalMarks)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(diacriticalMarks);
    log('Compression and decompression of string with diacritical marks successful');
  });

  it('should compress a string with punctuation marks', async () => {
    const punctuationMarks = '.,;:!?¡¿/-_()[]{}⟨⟩';
    log('Testing compression of string with punctuation marks');

    log('Compressing string with punctuation marks');
    const compressed = await compressData(punctuationMarks);
    log(`Original size: ${Buffer.byteLength(punctuationMarks)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(punctuationMarks);
    log('Compression and decompression of string with punctuation marks successful');
  });

  it('should handle compression of a string with ASCII art', async () => {
    const asciiArt = `
      _____ ____  __  __ ____  ____  _____ ____ _____ ___ ___  _   _
     / ____/ __ \\|  \\/  |  _ \\|  _ \\|  __ \\___ \\_   _/ _ \\__ \\| \\ | |
    | |   | |  | | \\  / | |_) | |_) | |__) |__) || || | | | ) |  \\| |
    | |   | |  | | |\\/| |  _ <|  _ <|  _  /|__ < | || | | |/ /| . \` |
    | |___| |__| | |  | | |_) | |_) | | \\ \\___) || || |_| / /_| |\\  |
     \\_____\\____/|_|  |_|____/|____/|_|  \\_\\____/_____\\___/____|_| \\_|
    `;
    log('Testing compression of string with ASCII art');

    log('Compressing string with ASCII art');
    const compressed = await compressData(asciiArt);
    log(`Original size: ${Buffer.byteLength(asciiArt)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(asciiArt);
    log('Compression and decompression of string with ASCII art successful');
  });

  it('should compress a string with a mix of all types of special characters', async () => {
    const mixedSpecialChars =
      '!@#$%^&* αβγδε こんにちは 😀🙂🤔 ∀∂∃∅∇∈ $€£¥₩ àáâãäå .,;:!? ASCII:\n |___|';
    log('Testing compression of string with a mix of all types of special characters');

    log('Compressing mixed special characters string');
    const compressed = await compressData(mixedSpecialChars);
    log(`Original size: ${Buffer.byteLength(mixedSpecialChars)} bytes`);
    log(`Compressed size: ${compressed.length} bytes`);

    log('Decompressing data');
    const decompressed = await decompressData(compressed);
    log(`Decompressed size: ${Buffer.byteLength(decompressed)} bytes`);

    expect(decompressed).toEqual(mixedSpecialChars);
    log(
      'Compression and decompression of string with a mix of all types of special characters successful',
    );
  });
});
