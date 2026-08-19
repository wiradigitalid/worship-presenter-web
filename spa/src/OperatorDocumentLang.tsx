import { useEffect } from 'react';
import {
  applyDocumentLang,
  asUiLocale,
  subscribeUiLocale,
} from '@/lib/ui-locale-document';

/** Apply the hub `ui_locale` to the operator document. Room-facing routes never mount this. */
export default function OperatorDocumentLang() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/session', { credentials: 'same-origin' });
      if (!res.ok || cancelled) return;
      const body = (await res.json()) as { ui_locale?: unknown };
      applyDocumentLang(
        asUiLocale(typeof body.ui_locale === 'string' ? body.ui_locale : null)
      );
    })();
    return subscribeUiLocale(applyDocumentLang);
  }, []);
  return null;
}
