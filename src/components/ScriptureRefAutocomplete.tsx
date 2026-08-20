import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEventHandler } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/operator';

type Suggestion = { name: string; short_name: string };
type DropdownPos = { top: number; left: number; width: number };

const SEARCH_DEBOUNCE_MS = 180;

function looksComplete(ref: string): boolean {
  return /:\s*\d/.test(ref);
}

export function ScriptureRefAutocomplete({
  value,
  onChange,
  placeholder,
  disabled,
  translation,
  inputClassName,
  onKeyDown,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  translation?: string;
  inputClassName?: string;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const [hits, setHits] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<'searching' | 'done' | 'failed'>(
    'done'
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const canPortal = typeof document !== 'undefined';
  const query = value.trim();
  const showList = open && query.length > 0 && !looksComplete(query);

  useEffect(() => {
    if (!showList) {
      setHits([]);
      return;
    }
    let active = true;
    setStatus('searching');
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: query });
      if (translation) params.set('translation', translation);
      void fetch(`/api/scripture?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      })
        .then(async (res) => {
          if (!res.ok) return null;
          const body = (await res.json()) as { suggestions?: Suggestion[] };
          return Array.isArray(body.suggestions) ? body.suggestions : [];
        })
        .then((rows) => {
          if (!active) return;
          if (rows === null) {
            setStatus('failed');
            setHits([]);
            return;
          }
          setStatus('done');
          setHits(rows);
        })
        .catch(() => {
          if (!active) return;
          setStatus('failed');
          setHits([]);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, showList, translation]);

  useLayoutEffect(() => {
    if (!showList || !inputRef.current) {
      setPos(null);
      return;
    }
    const update = () => {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [showList, query]);

  useEffect(() => {
    if (!showList) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (inputRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showList]);

  const emptyMessage =
    status === 'searching'
      ? t('form.scripture.searching')
      : status === 'failed'
        ? t('form.scripture.searchFailed')
        : t('form.scripture.none');

  const dropdown =
    canPortal &&
    showList &&
    pos &&
    createPortal(
      <div
        ref={listRef}
        className="fixed z-[100] max-h-48 overflow-y-auto rounded-xl border border-border/80 bg-popover shadow-md ring-1 ring-foreground/10"
        style={{ top: pos.top, left: pos.left, width: pos.width }}
      >
        {hits.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic text-center py-3 px-2">
            {emptyMessage}
          </p>
        ) : (
          hits.map((book) => (
            <Button
              key={book.name}
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-between gap-2 rounded-none px-2.5 py-1.5 text-[11px] font-normal"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(`${book.name} `);
                setOpen(false);
              }}
            >
              <span className="font-semibold">{book.name}</span>
              {book.short_name && book.short_name !== book.name ? (
                <span className="text-muted-foreground shrink-0">
                  {book.short_name}
                </span>
              ) : null}
            </Button>
          ))
        )}
      </div>,
      document.body
    );

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        className={cn('text-xs', inputClassName)}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onKeyDown={onKeyDown}
      />
      {dropdown}
    </div>
  );
}
