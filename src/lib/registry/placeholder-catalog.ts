/**
 * Placeholder Catalog (Story 20.5 / AD-19).
 *
 * One admitted key set plus the weekly resolver. Spellings match the shipped
 * seed so existing Generals keep filling; dotted names from the companion are
 * coverage, not a rename (AD-18). SongSet expansion keys are not in this list.
 */
import type { PlaceholderType } from './types';

export type CatalogEntry = {
  key: string;
  type: PlaceholderType;
};

export const PLACEHOLDER_CATALOG: readonly CatalogEntry[] = [
  { key: 'date', type: 'text' },
  { key: 'reference', type: 'text' },
  { key: 'text', type: 'text' },
  { key: 'performer', type: 'text' },
  { key: 'title', type: 'text' },
  { key: 'speaker', type: 'text' },
  { key: 'imageUrl', type: 'image' },
  { key: 'person', type: 'text' },
  { key: 'familyText', type: 'text' },
  { key: 'youthText', type: 'text' },
  { key: 'familyPhoto', type: 'image' },
  { key: 'youthPhoto', type: 'image' },
];

const CATALOG_BY_KEY = new Map(PLACEHOLDER_CATALOG.map((entry) => [entry.key, entry]));

export function catalogEntry(key: string): CatalogEntry | undefined {
  return CATALOG_BY_KEY.get(key);
}

export function isCatalogPlaceholderKey(key: string): boolean {
  return CATALOG_BY_KEY.has(key);
}

/** Weekly values a General can bind. Handler-supplied values override these. */
export type CatalogWeeklyInput = {
  serviceDate?: string;
  verseReference?: string;
  verseText?: string;
  themeReference?: string;
  themeText?: string;
  specialSong?: string | null;
  sermonTitle?: string | null;
  sermonSpeaker?: string | null;
  sermonGraphic?: string | null;
  closingPrayer?: string | null;
  familyPrayer?: string | null;
  youthPrayer?: string | null;
  familyPhoto?: string | null;
  youthPhoto?: string | null;
};

function firstText(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/**
 * Fills every catalog key the rundown can supply. `reference` / `text` prefer
 * the verse reading and fall back to the theme verse — the two shipped
 * Generals share those spellings, and a custom General cannot name both.
 */
export function catalogValuesFromWeekly(input: CatalogWeeklyInput): Readonly<
  Record<string, string>
> {
  const values: Record<string, string> = {};
  const date = firstText(input.serviceDate);
  if (date) values.date = date;
  const reference = firstText(input.verseReference, input.themeReference);
  if (reference) values.reference = reference;
  const text = firstText(input.verseText, input.themeText);
  if (text) values.text = text;
  const performer = firstText(input.specialSong);
  if (performer) values.performer = performer;
  const title = firstText(input.sermonTitle);
  if (title) values.title = title;
  const speaker = firstText(input.sermonSpeaker);
  if (speaker) values.speaker = speaker;
  const imageUrl = firstText(input.sermonGraphic);
  if (imageUrl) values.imageUrl = imageUrl;
  const person = firstText(input.closingPrayer);
  if (person) values.person = person;
  const familyText = firstText(input.familyPrayer);
  if (familyText) values.familyText = familyText;
  const youthText = firstText(input.youthPrayer);
  if (youthText) values.youthText = youthText;
  const familyPhoto = firstText(input.familyPhoto);
  if (familyPhoto) values.familyPhoto = familyPhoto;
  const youthPhoto = firstText(input.youthPhoto);
  if (youthPhoto) values.youthPhoto = youthPhoto;
  return values;
}
