import { DEFAULT_TRANSLATION } from './corpus';
import { getDb } from './db';
import {
  asUiLocale,
  isUiLocale,
  UI_LOCALE_ORDER,
  type UiLocale,
} from './i18n/locale';
import {
  DEFAULT_SLIDE_TRANSITION,
  isSlideTransition,
  parseSlideTransition,
  SLIDE_TRANSITIONS,
  type SlideTransition,
} from './transitions';

const RETENTION_KEY = 'pptx_retention_days';
const DEFAULT_RETENTION_DAYS = 60;

const SLIDE_TRANSITION_KEY = 'slide_transition';
const UI_LOCALE_KEY = 'ui_locale';
const DEFAULT_BIBLE_TRANSLATION_KEY = 'default_bible_translation';
const BIBLE_TRANSLATION_CODE_RE = /^[A-Z0-9][A-Z0-9_-]{0,31}$/;

export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, value);
}

/** Retention days: settings table → PPTX_RETENTION_DAYS env → 60. */
export function getPptxRetentionDays(): number {
  const fromDb = getSetting(RETENTION_KEY);
  if (fromDb != null) {
    const n = Number(fromDb);
    if (Number.isInteger(n) && n >= 0) return n;
  }
  const fromEnv = process.env.PPTX_RETENTION_DAYS?.trim();
  if (fromEnv) {
    const n = Number(fromEnv);
    if (Number.isInteger(n) && n >= 0) return n;
  }
  return DEFAULT_RETENTION_DAYS;
}

export function setPptxRetentionDays(days: number): void {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error('pptx_retention_days must be a non-negative integer');
  }
  setSetting(RETENTION_KEY, String(days));
}

/**
 * Deck transition: settings table → fade.
 *
 * A stored value that is not one of the known styles is coerced to the default
 * and logged rather than thrown. Deck generation reads this on every download,
 * and a junk row must never be the reason a service has no slides.
 */
export function getSlideTransition(): SlideTransition {
  const stored = getSetting(SLIDE_TRANSITION_KEY);
  if (stored == null) return DEFAULT_SLIDE_TRANSITION;

  const parsed = parseSlideTransition(stored);
  if (parsed !== stored) {
    console.error(
      `[settings] ignoring unknown ${SLIDE_TRANSITION_KEY} "${stored}"; ` +
        `falling back to "${DEFAULT_SLIDE_TRANSITION}"`
    );
  }
  return parsed;
}

export function setSlideTransition(value: SlideTransition): void {
  if (!isSlideTransition(value)) {
    throw new Error(
      `${SLIDE_TRANSITION_KEY} must be one of: ${SLIDE_TRANSITIONS.join(', ')}`
    );
  }
  setSetting(SLIDE_TRANSITION_KEY, value);
}

/**
 * Hub interface language: settings table → `en`.
 *
 * A stored value that is not one of the known locales is coerced to the default
 * and logged rather than thrown. A hand-edited settings row must not blank the
 * hub.
 */
export function getUiLocale(): UiLocale {
  const stored = getSetting(UI_LOCALE_KEY);
  if (stored == null) return asUiLocale(undefined);

  if (!isUiLocale(stored)) {
    console.error(
      `[settings] ignoring unknown ${UI_LOCALE_KEY} "${stored}"; ` +
        `falling back to "${asUiLocale(undefined)}"`
    );
  }
  return asUiLocale(stored);
}

export function setUiLocale(value: UiLocale): void {
  if (!isUiLocale(value)) {
    throw new Error(
      `${UI_LOCALE_KEY} must be one of: ${UI_LOCALE_ORDER.join(', ')}`
    );
  }
  setSetting(UI_LOCALE_KEY, value);
}

function normalizeBibleTranslationCode(raw: string): string | null {
  const v = raw.trim().toUpperCase();
  if (!BIBLE_TRANSLATION_CODE_RE.test(v)) return null;
  return v;
}

function isBibleTranslationInstalled(code: string): boolean {
  const row = getDb()
    .prepare(`SELECT 1 AS ok FROM bible_translations WHERE code = ?`)
    .get(code) as { ok: number } | undefined;
  return row != null;
}

/**
 * Resolved default for lookups when the request omits `translation`.
 * An uninstalled stored code is inert: we fall back to the shipped default
 * and leave the row in place (AD-26).
 */
export function getDefaultBibleTranslation(): string {
  const stored = getSetting(DEFAULT_BIBLE_TRANSLATION_KEY);
  const candidate =
    stored == null || stored.trim() === ''
      ? DEFAULT_TRANSLATION
      : stored.trim().toUpperCase();
  if (isBibleTranslationInstalled(candidate)) return candidate;
  if (stored != null && stored.trim() !== '') {
    console.error(
      `[settings] ignoring uninstalled ${DEFAULT_BIBLE_TRANSLATION_KEY} "${stored.trim()}"; ` +
        `falling back to "${DEFAULT_TRANSLATION}"`
    );
  }
  return DEFAULT_TRANSLATION;
}

export function setDefaultBibleTranslation(value: string): void {
  const code = normalizeBibleTranslationCode(value);
  if (!code) {
    throw new Error(
      `${DEFAULT_BIBLE_TRANSLATION_KEY} must be a bible translation code`
    );
  }
  setSetting(DEFAULT_BIBLE_TRANSLATION_KEY, code);
}
