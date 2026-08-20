import { useRouter } from '@/lib/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Role } from '@/lib/auth/session';
import { useT } from '@/lib/i18n/operator';

export type AccountRow = {
  id: number;
  username: string;
  role: Role;
  created_at: string;
};

export default function AccountsManager({
  initialAccounts,
}: {
  initialAccounts: AccountRow[];
}) {
  const router = useRouter();
  const { t } = useT();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('operator');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState<Record<number, string>>({});

  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  const refresh = (next: AccountRow[]) => {
    setAccounts(next);
    router.refresh();
  };

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('admin.accounts.createFailed'));
      setUsername('');
      setPassword('');
      setRole('operator');
      refresh([...accounts, data.account]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.accounts.createFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (id: number, nextRole: Role) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('admin.accounts.roleFailed'));
      refresh(
        accounts.map((a) => (a.id === id ? (data.account as AccountRow) : a))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.accounts.roleFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (id: number) => {
    const password = (resetPw[id] || '').trim();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('admin.accounts.resetFailed'));
      setResetPw((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.accounts.resetFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(t('admin.accounts.confirmDelete').replace('{name}', name))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t('admin.accounts.deleteFailed'));
      refresh(accounts.filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.accounts.deleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.section.accountManagement')}</CardTitle>
        <CardDescription>
          {t('admin.section.accountManagement.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <Input
            placeholder={t('admin.accounts.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            type="password"
            placeholder={t('admin.accounts.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operator">operator</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={busy}>
            {t('admin.accounts.create')}
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="text-xs text-muted-foreground">
          {accounts.length === 1
            ? t('admin.accounts.countOne')
            : t('admin.accounts.count').replace(
                '{n}',
                String(accounts.length)
              )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium py-2 pr-3">
                  {t('admin.accounts.colUsername')}
                </th>
                <th className="text-left font-medium py-2 pr-3">
                  {t('admin.accounts.colRole')}
                </th>
                <th className="text-left font-medium py-2 pr-3">
                  {t('admin.accounts.colCreated')}
                </th>
                <th className="text-left font-medium py-2 pr-3">
                  {t('admin.accounts.colPassword')}
                </th>
                <th className="text-right font-medium py-2">
                  {t('admin.accounts.colActions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-4 text-center text-muted-foreground"
                  >
                    {t('admin.accounts.empty')}
                  </td>
                </tr>
              ) : (
                accounts.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border/60 last:border-0"
                    title={`id ${a.id}`}
                  >
                    <td className="py-3 pr-3 font-medium">{a.username}</td>
                    <td className="py-3 pr-3">
                      <Select
                        value={a.role}
                        disabled={busy}
                        onValueChange={(v) => handleRoleChange(a.id, v as Role)}
                      >
                        <SelectTrigger size="sm" className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operator">operator</SelectItem>
                          <SelectItem value="admin">admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="password"
                          placeholder={t('admin.accounts.newPassword')}
                          value={resetPw[a.id] || ''}
                          onChange={(e) =>
                            setResetPw((prev) => ({
                              ...prev,
                              [a.id]: e.target.value,
                            }))
                          }
                          className="max-w-[180px]"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleResetPassword(a.id)}
                          className="whitespace-nowrap"
                        >
                          {t('admin.accounts.resetPassword')}
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleDelete(a.id, a.username)}
                      >
                        {t('admin.accounts.delete')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
