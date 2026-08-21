/**
 * Placeholder Catalog (DEC-004 Supplement S1): the 15 admitted keys and the
 * weekly resolver that fills them.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const catalogUrl = pathToFileURL(
  path.join(root, 'src', 'lib', 'registry', 'placeholder-catalog.ts')
).href;

const {
  PLACEHOLDER_CATALOG,
  isCatalogPlaceholderKey,
  catalogValuesFromWeekly,
} = await import(catalogUrl);

test('catalog admits the 15 shipped General keys and excludes SongSet expansion keys', () => {
  const keys = PLACEHOLDER_CATALOG.map((entry) => entry.key);
  for (const key of [
    'service_date',
    'scripture_reference',
    'scripture_text',
    'theme_reference',
    'theme_text',
    'special_song',
    'sermon_title',
    'sermon_speaker_name',
    'sermon_poster',
    'closing_prayer_person',
    'family_request',
    'youth_request',
    'family_name',
    'family_photo',
    'youth_photo',
  ]) {
    assert.equal(isCatalogPlaceholderKey(key), true, key);
  }
  assert.equal(isCatalogPlaceholderKey('hymnNumber'), false);
  assert.equal(isCatalogPlaceholderKey('songTitle'), false);
  assert.equal(isCatalogPlaceholderKey('lyrics'), false);
  assert.equal(isCatalogPlaceholderKey('date'), false);
  assert.equal(isCatalogPlaceholderKey('reference'), false);
  assert.equal(isCatalogPlaceholderKey('text'), false);
  assert.equal(isCatalogPlaceholderKey('imageUrl'), false);
  assert.equal(isCatalogPlaceholderKey('person'), false);
  assert.deepEqual(
    PLACEHOLDER_CATALOG.filter((entry) => entry.type === 'image').map(
      (entry) => entry.key
    ),
    ['sermon_poster', 'family_photo', 'youth_photo']
  );
  assert.equal(keys.length, 15);
});

test('weekly resolver fills every catalog key it can', () => {
  const values = catalogValuesFromWeekly({
    serviceDate: '2026-07-11',
    scriptureReference: 'John 4:23',
    scriptureText: 'true worshipers',
    themeReference: 'Psalm 23:1',
    themeText: 'The Lord is my shepherd',
    specialSong: 'Ada Chen',
    sermonTitle: 'Living Water',
    sermonSpeaker: 'Jordan Blake',
    sermonGraphic: 'https://example.com/sermon.png',
    closingPrayer: 'Sam Rivera',
    familyRequest: 'Pray for the Harts',
    youthRequest: 'Youth camp',
    familyPhoto: 'https://example.com/family.png',
    youthPhoto: 'https://example.com/youth.png',
  });
  assert.equal(values.service_date, '2026-07-11');
  assert.equal(values.scripture_reference, 'John 4:23');
  assert.equal(values.scripture_text, 'true worshipers');
  assert.equal(values.theme_reference, 'Psalm 23:1');
  assert.equal(values.theme_text, 'The Lord is my shepherd');
  assert.equal(values.special_song, 'Ada Chen');
  assert.equal(values.sermon_title, 'Living Water');
  assert.equal(values.sermon_speaker_name, 'Jordan Blake');
  assert.equal(values.sermon_poster, 'https://example.com/sermon.png');
  assert.equal(values.closing_prayer_person, 'Sam Rivera');
  assert.equal(values.family_request, 'Pray for the Harts');
  assert.equal(values.youth_request, 'Youth camp');
  assert.equal(values.family_photo, 'https://example.com/family.png');
  assert.equal(values.youth_photo, 'https://example.com/youth.png');
});

test('weekly resolver leaves scripture_* and theme_* independent — no fallback merge', () => {
  const values = catalogValuesFromWeekly({
    themeReference: 'Psalm 23:1',
    themeText: 'The Lord is my shepherd',
  });
  assert.equal(values.theme_reference, 'Psalm 23:1');
  assert.equal(values.theme_text, 'The Lord is my shepherd');
  assert.equal(values.scripture_reference, undefined);
  assert.equal(values.scripture_text, undefined);
});
