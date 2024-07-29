import {
  getLastUpdatedDate,
  getLastAccessedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastDates,
  updateLastDates,
} from '../../../../utils/lastDate.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('special-characters-in-identifiers-server-test.log');
const log = createLogger(logStream);

describe('Last Date Server Utilities - Special Characters in Identifiers', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;

  beforeAll(() => {
    log('Starting Last Date Server Utilities Special Characters in Identifiers tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = jest.fn(async (key: string): Promise<string | null> => mockStorage[key] || null);
    mockSet = jest.fn(async (key: string, value: string): Promise<void> => {
      mockStorage[key] = value;
    });
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle identifiers with common special characters', async () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    const identifier = `testId${specialChars}`;
    const storeName = 'testStore';
    const date = new Date('2023-07-01T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with special characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with Unicode characters', async () => {
    const identifier = 'testId你好世界🌍';
    const storeName = 'testStore';
    const date = new Date('2023-07-02T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with Unicode characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with whitespace characters', async () => {
    const identifier = 'test Id with spaces\tand\ttabs\nand\nnewlines';
    const storeName = 'testStore';
    const date = new Date('2023-07-03T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for identifier with whitespace: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with URL-encoded characters', async () => {
    const identifier = 'test%20Id%3Fwith%26encoded%3Dcharacters';
    const storeName = 'testStore';
    const date = new Date('2023-07-04T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with URL-encoded characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with very long special character sequences', async () => {
    const identifier = 'testId' + '!@#$%^&*()_+-=[]{}|;:,.<>?`~'.repeat(50);
    const storeName = 'testStore';
    const date = new Date('2023-07-05T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for identifier with long special character sequence: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle identifiers with mixed alphanumeric and special characters', async () => {
    const identifier = 'test123!@#abc456$%^def789&*()';
    const storeName = 'testStore';
    const date = new Date('2023-07-06T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for identifier with mixed characters: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with non-printable ASCII characters', async () => {
    const identifier = 'testId\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F';
    const storeName = 'testStore';
    const date = new Date('2023-07-07T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for identifier with non-printable ASCII characters: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle identifiers with emoji characters', async () => {
    const identifier = 'testId🚀🌈🎉👨‍👩‍👧‍👦';
    const storeName = 'testStore';
    const date = new Date('2023-07-08T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with emoji characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with different Unicode scripts', async () => {
    const identifier = 'testIdАБВあいうアイウ你好한글';
    const storeName = 'testStore';
    const date = new Date('2023-07-09T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for identifier with different Unicode scripts: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with control characters', async () => {
    const identifier = 'testId\b\f\n\r\t\v';
    const storeName = 'testStore';
    const date = new Date('2023-07-10T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with control characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with XML special characters', async () => {
    const identifier = 'testId<&>\'"\u0026';
    const storeName = 'testStore';
    const date = new Date('2023-07-11T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with XML special characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with SQL injection attempt characters', async () => {
    const identifier = "testId'; DROP TABLE users; --";
    const storeName = 'testStore';
    const date = new Date('2023-07-12T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for identifier with SQL injection attempt: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with shell command characters', async () => {
    const identifier = 'testId`ls -la`$(echo vulnerable)';
    const storeName = 'testStore';
    const date = new Date('2023-07-13T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with shell command characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with zero-width characters', async () => {
    const identifier = 'testId\u200B\u200C\u200D\uFEFF';
    const storeName = 'testStore';
    const date = new Date('2023-07-14T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with zero-width characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with combining diacritical marks', async () => {
    const identifier = 'testIda\u0301e\u0302i\u0308o\u030Au\u0303';
    const storeName = 'testStore';
    const date = new Date('2023-07-15T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved dates for identifier with combining diacritical marks: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with right-to-left override characters', async () => {
    const identifier = 'testId\u202Ereversed text\u202C';
    const storeName = 'testStore';
    const date = new Date('2023-07-16T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with right-to-left override: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with mathematical symbols', async () => {
    const identifier = 'testId∀∂∈ℝ∧∪≡∞';
    const storeName = 'testStore';
    const date = new Date('2023-07-17T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with mathematical symbols: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with currency symbols', async () => {
    const identifier = 'testId$€£¥₩₪';
    const storeName = 'testStore';
    const date = new Date('2023-07-18T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for identifier with currency symbols: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with very similar Unicode characters', async () => {
    const identifier = 'testIdAАΑΑААאהＡａ';
    const storeName = 'testStore';
    const date = new Date('2023-07-19T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for identifier with very similar Unicode characters: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle identifiers with special characters from different languages', async () => {
    const identifier = 'testIdÆØÅæøåÖäüßñ';
    const storeName = 'testStore';
    const date = new Date('2023-07-20T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for identifier with special characters from different languages: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle identifiers with extremely long Unicode sequences', async () => {
    const identifier = 'testId' + '🚀'.repeat(1000);
    const storeName = 'testStore';
    const date = new Date('2023-07-21T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved dates for identifier with extremely long Unicode sequence: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with mixed scripts and directions', async () => {
    const identifier = 'testId你好world!שלום';
    const storeName = 'testStore';
    const date = new Date('2023-07-22T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with mixed scripts and directions: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with unusual Unicode characters', async () => {
    const identifier = 'testId\u{1F980}\u{1F984}\u{1F98E}\u{1F991}\u{1F419}';
    const storeName = 'testStore';
    const date = new Date('2023-07-23T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with unusual Unicode characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with Unicode surrogate pairs', async () => {
    const identifier = 'testId\uD800\uDC00\uD800\uDC01\uD800\uDC02';
    const storeName = 'testStore';
    const date = new Date('2023-07-24T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for identifier with Unicode surrogate pairs: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with invisible characters', async () => {
    const identifier = 'testId\u200E\u200F\u061C\u200D\u2060\u2061\u2062\u2063\u2064';
    const storeName = 'testStore';
    const date = new Date('2023-07-25T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with invisible characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with characters from private use areas', async () => {
    const identifier = 'testId\uE000\uE001\uF8FF\u{F0000}\u{FFFFD}';
    const storeName = 'testStore';
    const date = new Date('2023-07-26T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with private use area characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with characters from different Unicode blocks', async () => {
    const identifier = 'testId\u0391\u0411\u05D0\u0627\u0E01\u3042\u4E00';
    const storeName = 'testStore';
    const date = new Date('2023-07-27T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved dates for identifier with characters from different Unicode blocks: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with characters that look like separators', async () => {
    const identifier = 'testId/test:test|test\\test.test_test';
    const storeName = 'testStore';
    const date = new Date('2023-07-28T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with separator-like characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with null characters', async () => {
    const identifier = 'testId\0test\0';
    const storeName = 'testStore';
    const date = new Date('2023-07-29T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with null characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with characters from multiple languages in a single identifier', async () => {
    const identifier = 'testIdEnglishالعربية中文한국어';
    const storeName = 'testStore';
    const date = new Date('2023-07-30T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for identifier with multiple languages: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with potential XSS payload', async () => {
    const identifier = 'testId<script>alert("XSS")</script>';
    const storeName = 'testStore';
    const date = new Date('2023-07-31T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with potential XSS payload: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with all ASCII printable characters', async () => {
    const identifier =
      ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    const storeName = 'testStore';
    const date = new Date('2023-08-01T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved dates for identifier with all ASCII printable characters: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with repeated special characters', async () => {
    const identifier = 'test!!!Id@@@With###Multiple$$$Special^^^Characters';
    const storeName = 'testStore';
    const date = new Date('2023-08-02T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with repeated special characters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with Unicode normalization forms', async () => {
    const identifierNFC = '\u00C5'; // Å as single character
    const identifierNFD = '\u0041\u030A'; // Å as A + combining ring above
    const storeName = 'testStore';
    const date = new Date('2023-08-03T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifierNFC, storeName, date);
    const resultNFC = await getLastAccessedDate(mockGet, identifierNFC, storeName);
    const resultNFD = await getLastAccessedDate(mockGet, identifierNFD, storeName);

    log(`Retrieved date for NFC identifier: ${resultNFC.toISOString()}`);
    log(`Retrieved date for NFD identifier: ${resultNFD.toISOString()}`);
    expect(resultNFC).toEqual(date);
    expect(resultNFD).toEqual(date);
  });

  it('should handle identifiers with Unicode characters outside the BMP', async () => {
    const identifier = 'testId\u{1F600}\u{1F64F}\u{1F680}'; // Emoji characters
    const storeName = 'testStore';
    const date = new Date('2023-08-04T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved dates for identifier with Unicode characters outside the BMP: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with characters that need percent-encoding in URLs', async () => {
    const identifier = 'test Id with spaces and+plus&ampersand%percent';
    const storeName = 'testStore';
    const date = new Date('2023-08-05T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier needing percent-encoding: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with very similar looking characters', async () => {
    const identifier1 = 'testIdIl1|';
    const identifier2 = 'testIdI|1l';
    const storeName = 'testStore';
    const date1 = new Date('2023-08-06T12:00:00.000Z');
    const date2 = new Date('2023-08-06T13:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier1, storeName, date1);
    await updateLastAccessedDate(mockSet, identifier2, storeName, date2);

    const result1 = await getLastAccessedDate(mockGet, identifier1, storeName);
    const result2 = await getLastAccessedDate(mockGet, identifier2, storeName);

    log(`Retrieved date for identifier1 with similar looking characters: ${result1.toISOString()}`);
    log(`Retrieved date for identifier2 with similar looking characters: ${result2.toISOString()}`);
    expect(result1).toEqual(date1);
    expect(result2).toEqual(date2);
  });

  it('should handle identifiers with invisible separator characters', async () => {
    const identifier = 'test\u2060Id\u200BWit\u200Ch\u200DInvisible\u200ESeparators';
    const storeName = 'testStore';
    const date = new Date('2023-08-07T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved dates for identifier with invisible separator characters: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with characters from different Unicode categories', async () => {
    const identifier = 'testId\u0041\u00B2\u0601\u20AC\u200D\u2194\u2800\u3042\u{1F600}';
    const storeName = 'testStore';
    const date = new Date('2023-08-08T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for identifier with characters from different Unicode categories: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle identifiers with bi-directional text', async () => {
    const identifier = 'testId\u202Eenglish text\u202Cעברית';
    const storeName = 'testStore';
    const date = new Date('2023-08-09T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with bi-directional text: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with unusual whitespace characters', async () => {
    const identifier = 'test\u00A0Id\u2002With\u2003Unusual\u2004Whitespace';
    const storeName = 'testStore';
    const date = new Date('2023-08-10T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved dates for identifier with unusual whitespace characters: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with ligatures', async () => {
    const identifier = 'testIdWithLigatures\uFB01\uFB02';
    const storeName = 'testStore';
    const date = new Date('2023-08-11T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with ligatures: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with full-width and half-width characters', async () => {
    const identifier = 'testId\uFF41\uFF42\uFF43\uFF21\uFF22\uFF23１２３';
    const storeName = 'testStore';
    const date = new Date('2023-08-12T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for identifier with full-width and half-width characters: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle identifiers with superscript and subscript characters', async () => {
    const identifier = 'testId\u00B2\u00B3\u2070\u2074\u2075\u2076\u2081\u2082\u2083';
    const storeName = 'testStore';
    const date = new Date('2023-08-13T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved dates for identifier with superscript and subscript characters: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with characters from ancient scripts', async () => {
    const identifier = 'testId\u13A0\u13A1\u13A2\u16A0\u16A1\u16A2';
    const storeName = 'testStore';
    const date = new Date('2023-08-14T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for identifier with characters from ancient scripts: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle identifiers with phonetic extension characters', async () => {
    const identifier = 'testId\u1D00\u1D01\u1D02\u1D03\u1D04\u1D05';
    const storeName = 'testStore';
    const date = new Date('2023-08-15T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for identifier with phonetic extension characters: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle identifiers with variation selectors', async () => {
    const identifier = 'testId\u309A\uFE00\u309A\uFE01';
    const storeName = 'testStore';
    const date = new Date('2023-08-16T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(`Retrieved dates for identifier with variation selectors: ${JSON.stringify(result)}`);
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });

  it('should handle identifiers with characters from the Unicode Special-Purpose Plane', async () => {
    const identifier = 'testId\u{FFF9}\u{FFFA}\u{FFFB}\u{FFFC}\u{FFFD}';
    const storeName = 'testStore';
    const date = new Date('2023-08-17T12:00:00.000Z');

    await updateLastUpdatedDate(mockSet, identifier, storeName, date);
    const result = await getLastUpdatedDate(mockGet, identifier, storeName);

    log(
      `Retrieved date for identifier with characters from the Unicode Special-Purpose Plane: ${result.toISOString()}`,
    );
    expect(result).toEqual(date);
  });

  it('should handle identifiers with noncharacters', async () => {
    const identifier = 'testId\uFFFE\uFFFF\u{1FFFE}\u{1FFFF}';
    const storeName = 'testStore';
    const date = new Date('2023-08-18T12:00:00.000Z');

    await updateLastAccessedDate(mockSet, identifier, storeName, date);
    const result = await getLastAccessedDate(mockGet, identifier, storeName);

    log(`Retrieved date for identifier with noncharacters: ${result.toISOString()}`);
    expect(result).toEqual(date);
  });

  it('should handle identifiers with extremely long sequences of combining characters', async () => {
    const baseCharacter = 'a';
    const combiningCharacter = '\u0301'; // Combining acute accent
    const identifier = `testId${baseCharacter}${combiningCharacter.repeat(100)}`;
    const storeName = 'testStore';
    const date = new Date('2023-08-19T12:00:00.000Z');

    await updateLastDates(mockSet, identifier, storeName, {
      lastUpdatedDate: date,
      lastAccessedDate: date,
    });
    const result = await getLastDates(mockGet, identifier, storeName);

    log(
      `Retrieved dates for identifier with long sequence of combining characters: ${JSON.stringify(result)}`,
    );
    expect(result.lastUpdatedDate).toEqual(date);
    expect(result.lastAccessedDate).toEqual(date);
  });
});
