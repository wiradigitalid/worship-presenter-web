import { useT } from '@/lib/i18n/operator';
import { useRouter } from '@/lib/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

/**
 * `text-destructive`, not a hand-rolled `red-600`/`red-400` pair — see
 * `tests/theme-chrome.test.mjs` AC-6. The menu variant delegates styling to
 * `DropdownMenuItem` with `variant="destructive"`.
 */
const LOGOUT_CLASS =
  'w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-red-500/10 text-destructive transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50';

export default function LogoutButton({
  variant = 'button',
}: {
  variant?: 'button' | 'menu';
}) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      router.replace('/login');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'menu') {
    return (
      <DropdownMenuItem
        variant="destructive"
        disabled={busy}
        onClick={() => void logout()}
      >
        <LogOut className="size-4" />
        {busy ? t('chrome.logout.busy') : t('chrome.logout')}
      </DropdownMenuItem>
    );
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className={LOGOUT_CLASS}
    >
      <LogOut className="size-4" />
      {busy ? t('chrome.logout.busy') : t('chrome.logout')}
    </button>
  );
}
