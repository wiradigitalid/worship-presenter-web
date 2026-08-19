import { asUiLocale, isUiLocale, type UiLocale } from './i18n/locale';

const LOCALE_EVENT = 'ui-locale-changed';

export function applyDocumentLang(locale: UiLocale) {
  document.documentElement.lang = locale;
}

export function announceUiLocale(locale: string) {
  if (!isUiLocale(locale)) return;
  applyDocumentLang(locale);
  window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: locale }));
}

export function subscribeUiLocale(handler: (locale: UiLocale) => void): () => void {
  const onChanged = (event: Event) => {
    const locale = (event as CustomEvent<unknown>).detail;
    if (isUiLocale(locale)) handler(locale);
  };
  window.addEventListener(LOCALE_EVENT, onChanged);
  return () => window.removeEventListener(LOCALE_EVENT, onChanged);
}

export { asUiLocale };
