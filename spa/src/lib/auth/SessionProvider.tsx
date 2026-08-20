import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';

export type Session = {
  username: string;
  role: 'admin' | 'operator';
};

type SessionStatus = 'loading' | 'authed' | 'unauthed';

type SessionContextValue = {
  session: Session | null;
  status: SessionStatus;
};

const Ctx = createContext<SessionContextValue | null>(null);

/**
 * One shared `/api/session` fetch for the whole operator tree.
 *
 * The operator pages used to do `useState(null)` + `useEffect(fetch)` and
 * `return null` until it resolved. Each route change unmounted the page, so
 * every menu click refetched and flashed an empty frame. Header was a child of
 * the page too, so it unmounted and remounted on every navigation.
 *
 * The provider lives in `App.tsx` above the operator `Routes` only. On the
 * projected tree it never mounts, so `/api/session` is not requested on a
 * slideshow/projector page that does not need it.
 *
 * On a 401 we navigate to `/login` once and stop. A retry (e.g. after the
 * operator signs back in) refetches on the next mount; we do not poll.
 *
 * `useNavigate` is read through a ref so the effect only runs once on mount.
 * Declarative `<BrowserRouter>` returns the unstable variant, whose identity
 * changes whenever the location does; listing it as a dep would re-fire the
 * fetch on every navigation, which is exactly what this provider exists to
 * stop.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/session', { credentials: 'same-origin' });
      if (cancelled) return;
      if (res.status === 401) {
        setStatus('unauthed');
        navigateRef.current('/login', { replace: true });
        return;
      }
      const body = (await res.json().catch(() => null)) as Session | null;
      if (cancelled) return;
      if (body && typeof body.username === 'string' && (body.role === 'admin' || body.role === 'operator')) {
        setSession(body);
        setStatus('authed');
      } else {
        setStatus('unauthed');
        navigateRef.current('/login', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <Ctx.Provider value={{ session, status }}>{children}</Ctx.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return ctx;
}
