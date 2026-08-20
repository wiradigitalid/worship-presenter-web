import { useState } from 'react';
import { CircleAlert, Plus, Search, User, X } from 'lucide-react';
import Link from '@/components/Link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/operator';

interface ServiceRow {
  id: number;
  date: string;
  parsed_data: string | null;
  created_at: string;
}

interface ParsedRundown {
  date: string | null;
  sermon: {
    speaker: string;
    title: string;
  } | null;
}

function formatDateTime(isoString: string) {
  if (!isoString) return '';
  const utcString = isoString.includes('Z') || isoString.includes('+') 
    ? isoString 
    : `${isoString.replace(' ', 'T')}Z`;
  const d = new Date(utcString);
  if (isNaN(d.getTime())) return isoString;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${dateStr} ${timeStr}`;
}

function formatServiceDate(dateStr: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

export default function ServicesList({ services }: { services: ServiceRow[] }) {
  const { t } = useT();
  const [query, setQuery] = useState('');

  const filteredServices = services.filter((svc) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;

    let parsed: ParsedRundown | null = null;
    try {
      parsed = svc.parsed_data ? JSON.parse(svc.parsed_data) as ParsedRundown : null;
    } catch (e) {
      // ignore
    }

    const speaker = (parsed?.sermon?.speaker || '').toLowerCase();
    const title = (parsed?.sermon?.title || '').toLowerCase();
    const date = svc.date.toLowerCase();
    const dateFormatted = formatServiceDate(svc.date).toLowerCase();

    return (
      speaker.includes(q) ||
      title.includes(q) ||
      date.includes(q) ||
      dateFormatted.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 shrink-0 -translate-y-1/2 text-muted-foreground/60"
            aria-hidden
          />
          <Input
            type="text"
            className="h-auto rounded-xl border-border/80 bg-card/60 py-2.5 pr-10 pl-10 text-xs shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            placeholder={t('dashboard.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
            >
              <X className="size-4 shrink-0" aria-hidden />
            </Button>
          ) : null}
        </div>
        <Button
          render={<Link href="/services/new" />}
          className="h-auto w-full shrink-0 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md sm:w-auto"
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          {t('dashboard.newService')}
        </Button>
      </div>

      {filteredServices.length === 0 ? (
        <div className="border border-border/80 bg-card/50 backdrop-blur-md rounded-2xl p-12 text-center shadow-sm max-w-md mx-auto mt-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <CircleAlert className="size-6 shrink-0" aria-hidden />
          </div>
          <h3 className="text-base font-bold text-foreground">{t('dashboard.emptyTitle')}</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
            {t('dashboard.emptyBody')}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((svc) => {
            let parsed: ParsedRundown | null = null;
            try {
              parsed = svc.parsed_data ? JSON.parse(svc.parsed_data) as ParsedRundown : null;
            } catch (e) {
              // ignore
            }
            const speaker = parsed?.sermon?.speaker || '';
            const title = parsed?.sermon?.title || t('dashboard.untitled');
            
            const serviceDateFormatted = formatServiceDate(svc.date);
            const createdDateFormatted = formatDateTime(svc.created_at);

            return (
              <Link key={svc.id} href={`/services/${svc.id}`} className="block group">
                <div className="h-full border border-border/80 bg-card/40 backdrop-blur-md p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        #{svc.id}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors duration-200">
                        {title}
                      </h3>
                      {speaker && (
                        <p className="text-xs text-muted-foreground/90 font-medium flex items-center gap-1.5">
                          <User className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
                          {speaker}
                        </p>
                      )}
                      <p className="text-xs font-semibold text-muted-foreground pt-1">
                        {serviceDateFormatted}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border/60 mt-5 flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>
                      {t('dashboard.generatedBy').replace('{when}', createdDateFormatted)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
