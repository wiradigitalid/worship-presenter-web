import { useT } from '@/lib/i18n/operator';
import { useRouter } from '@/lib/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

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
    <Button
      type="button"
      variant="ghost"
      className="shrink-0 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={logout}
      disabled={busy}
    >
      <LogOut className="size-4" />
      {busy ? t('chrome.logout.busy') : t('chrome.logout')}
    </Button>
  );
}
