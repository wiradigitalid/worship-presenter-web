import { FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { safeNextPath } from '@/lib/auth/safe-next';
import { useT } from '@/lib/i18n/operator';

const LOGIN_FIELD =
  'h-auto rounded-xl border-border/80 bg-background/50 px-4 py-3 text-sm shadow-none focus-visible:border-primary/80 focus-visible:ring-2 focus-visible:ring-primary/20 dark:bg-background/50';

function BrandMark() {
  return (
    <div
      className="mb-6 flex size-12 items-center justify-center rounded-xl border border-border bg-card/80 text-primary shadow-md backdrop-blur-md"
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0h.5m-.5 0h-10.5m.5 0h-1.5"
        />
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useT();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || t('login.invalid'));
      }
      window.location.assign(safeNextPath(searchParams.get('next')));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6 font-sans text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 dark:opacity-100"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <BrandMark />
        <h1 className="mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
          {t('chrome.brand.title')}
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">{t('login.subtitle')}</p>

        <div className="relative w-full overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-8 shadow-xl backdrop-blur-xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="login-username"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('login.username')}
              </Label>
              <Input
                id="login-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder={t('login.usernamePlaceholder')}
                required
                disabled={busy}
                className={LOGIN_FIELD}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="login-password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t('login.password')}
              </Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder={t('login.passwordPlaceholder')}
                required
                disabled={busy}
                className={LOGIN_FIELD}
              />
            </div>
            {error ? (
              <p className="animate-pulse text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={busy}
              className="mt-2 h-auto w-full rounded-xl py-3.5 text-sm font-semibold shadow-md hover:bg-primary/95 hover:shadow-primary/10 active:scale-[0.98]"
            >
              {busy ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
