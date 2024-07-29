import * as HitCountModule from '../../../../utils/hitCount.server';
import { createLogStream, createLogger, setupErrorHandling } from '../../../jest/default/logging';

const logStream = createLogStream('special-characters-in-identifiers-test.log');
const log = createLogger(logStream);

describe('Hit Count Server Utilities - Special Characters in Identifiers', () => {
  let mockStorage: { [key: string]: string };
  let mockGet: (key: string) => Promise<string | null>;
  let mockSet: (key: string, value: string) => Promise<void>;

  beforeAll(() => {
    log('Starting Hit Count Server Utilities Special Characters in Identifiers tests...');
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    mockStorage = {};
    mockGet = async (key: string): Promise<string | null> => mockStorage[key] || null;
    mockSet = async (key: string, value: string): Promise<void> => {
      mockStorage[key] = value;
    };
  });

  afterAll(() => {
    logStream.end();
  });

  it('should handle identifiers with special characters', async () => {
    log('\nTesting identifiers with special characters...');
    const identifiers = [
      'id-with-hyphens',
      'id_with_underscores',
      'id.with.periods',
      'id:with:colons',
      'id/with/slashes',
      'id\\with\\backslashes',
      'id~with~tildes',
      'id!with!exclamations',
      'id@with@at@signs',
      'id#with#hash#signs',
      'id$with$dollar$signs',
      'id%with%percent%signs',
      'id^with^carets',
      'id&with&ampersands',
      'id*with*asterisks',
      'id(with(parentheses))',
      'id)with)parentheses))',
      'id[with[brackets]]',
      'id]with]brackets]]',
      'id{with{braces}}',
      'id}with}braces}}',
      'id|with|vertical|bars',
      'id;with;semicolons',
      "id'with'single'quotes",
      'id"with"double"quotes',
      'id<with<angle<brackets>',
      'id>with>angle>brackets>',
      'id,with,commas',
      'id?with?question?marks',
      'id`with`backticks`',
      'id+with+plus+signs',
      'id=with=equals=signs',
    ];
    const storeName = 'testStore';

    for (const identifier of identifiers) {
      await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    for (const identifier of identifiers) {
      const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      log(`Hit counts for identifier "${identifier}":`);
      log(`  Get hit count: ${getHitCount}`);
      log(`  Set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(1);
      expect(setHitCount).toBe(1);
    }
  });

  it('should handle identifiers with Unicode characters', async () => {
    log('\nTesting identifiers with Unicode characters...');
    const identifiers = [
      'id-with-é-è-ê-ë',
      'id-with-á-à-â-ä',
      'id-with-í-ì-î-ï',
      'id-with-ó-ò-ô-ö',
      'id-with-ú-ù-û-ü',
      'id-with-ñ',
      'id-with-ç',
      'id-with-ß',
      'id-with-æ',
      'id-with-ø',
      'id-with-å',
      'id-with-日本語',
      'id-with-中文',
      'id-with-한글',
      'id-with-ελληνικά',
      'id-with-кириллица',
      'id-with-עִברִית',
      'id-with-عربي',
      'id-with-ไทย',
      'id-with-తెలుగు',
      'id-with-हिन्दी',
      'id-with-বাংলা',
      'id-with-ਪੰਜਾਬੀ',
      'id-with-اُردُو',
      'id-with-አማርኛ',
      'id-with-ខ្មែរ',
      'id-with-ᓀᐦᐃᔭᐍᐏᐣ',
      'id-with-ᐃᓄᒃᑎᑐᑦ',
      'id-with-𐐀𐐩𐑅𐑆',
    ];
    const storeName = 'testStore';

    for (const identifier of identifiers) {
      await HitCountModule.incrementGetHitCount(mockGet, mockSet, identifier, storeName);
      await HitCountModule.incrementSetHitCount(mockGet, mockSet, identifier, storeName);
    }

    for (const identifier of identifiers) {
      const { getHitCount, setHitCount } = await HitCountModule.getHitCounts(
        mockGet,
        identifier,
        storeName,
      );
      log(`Hit counts for identifier "${identifier}":`);
      log(`  Get hit count: ${getHitCount}`);
      log(`  Set hit count: ${setHitCount}`);
      expect(getHitCount).toBe(1);
      expect(setHitCount).toBe(1);
    }
  });
});
