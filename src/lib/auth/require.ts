import { getAccountById } from '@/lib/auth/accounts';
import { isSessionRevoked } from '@/lib/auth/revocation';
import {
  verifySession,
  type Role,
  type SessionPayload,
} from '@/lib/auth/session';

/**
 * The server-side half of session validation, shared by cookie checks so a
 * revoked cookie dies at the Go gate and in any Node helper that still reads
 * SQLite.
 *
 * Rejects, in order: a deleted account, a role that no longer matches the
 * cookie (demotion), a `tv` older than `accounts.token_version` (password
 * change revoked everything), and an explicitly revoked `sid` (logout).
 */
export function validateSessionAgainstDb(
  session: SessionPayload,
  role?: Role
): SessionPayload | null {
  const account = getAccountById(session.uid);
  if (!account) return null;
  if (account.role !== session.role) return null;
  if (role && account.role !== role) return null;
  if (Number(account.token_version) !== session.tv) return null;
  if (isSessionRevoked(session.sid)) return null;
  return {
    uid: account.id,
    role: account.role,
    sid: session.sid,
    tv: Number(account.token_version),
    exp: session.exp,
  };
}

/**
 * Verify a raw cookie value and then re-check it against the DB.
 *
 * Use this instead of bare `verifySession` anywhere a helper decides what to
 * show: a signature proves only that the cookie was once issued, not that it
 * is still live, and the returned `role` comes from the account row rather
 * than the cookie's claim.
 */
export async function validateSessionToken(
  token: string | undefined | null,
  role?: Role
): Promise<SessionPayload | null> {
  const session = await verifySession(token);
  if (!session) return null;
  return validateSessionAgainstDb(session, role);
}

export async function requireSession(
  token: string | undefined | null,
  role?: Role
): Promise<SessionPayload | null> {
  return validateSessionToken(token, role);
}

export async function requireAdminSession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  return validateSessionToken(token, 'admin');
}
