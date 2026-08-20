/**
 * Placeholder Catalog (Story 20.5): admitted keys and the weekly resolver.
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

test('catalog admits shipped General spellings and excludes SongSet expansion keys', () => {
  const keys = PLACEHOLDER_CATALOG.map((entry) => entry.key);
  for (const key of [
    'date',
    'reference',
    'text',
    'performer',
    'title',
    'speaker',
    'imageUrl',
    'person',
    'familyText',
    'youthText',
    'familyPhoto',
    'youthPhoto',
  ]) {
    assert.equal(isCatalogPlaceholderKey(key), true, key);
  }
  assert.equal(isCatalogPlaceholderKey('hymnNumber'), false);
  assert.equal(isCatalogPlaceholderKey('songTitle'), false);
  assert.equal(isCatalogPlaceholderKey('lyrics'), false);
  assert.equal(isCatalogPlaceholderKey('themeVerse.reference'), false);
  assert.deepEqual(
    PLACEHOLDER_CATALOG.filter((entry) => entry.type === 'image').map(
      (entry) => entry.key
    ),
    ['imageUrl', 'familyPhoto', 'youthPhoto']
  );
  assert.equal(keys.length, 12);
});

test('weekly resolver prefers verse reading and fills every catalog key it can', () => {
  const values = catalogValuesFromWeekly({
    serviceDate: '2026-07-11',
    verseReference: 'John 4:23',
    verseText: 'true worshipers',
    themeReference: 'Psalm 23:1',
    themeText: 'The Lord is my shepherd',
    specialSong: 'Ada Chen',
    sermonTitle: 'Living Water',
    sermonSpeaker: 'Jordan Blake',
    sermonGraphic: 'https://example.com/sermon.png',
    closingPrayer: 'Sam Rivera',
    familyPrayer: 'Pray for the Harts',
    youthPrayer: 'Youth camp',
    familyPhoto: 'https://example.com/family.png',
    youthPhoto: 'https://example.com/youth.png',
  });
  assert.equal(values.date, '2026-07-11');
  assert.equal(values.reference, 'John 4:23');
  assert.equal(values.text, 'true worshipers');
  assert.equal(values.performer, 'Ada Chen');
  assert.equal(values.title, 'Living Water');
  assert.equal(values.speaker, 'Jordan Blake');
  assert.equal(values.imageUrl, 'https://example.com/sermon.png');
  assert.equal(values.person, 'Sam Rivera');
  assert.equal(values.familyText, 'Pray for the Harts');
  assert.equal(values.youthText, 'Youth camp');
  assert.equal(values.familyPhoto, 'https://example.com/family.png');
  assert.equal(values.youthPhoto, 'https://example.com/youth.png');
});

test('weekly resolver falls back from verse reading to the theme verse', () => {
  const values = catalogValuesFromWeekly({
    themeReference: 'Psalm 23:1',
    themeText: 'The Lord is my shepherd',
  });
  assert.equal(values.reference, 'Psalm 23:1');
  assert.equal(values.text, 'The Lord is my shepherd');
});
