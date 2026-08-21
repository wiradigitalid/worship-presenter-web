import {
  useNavigate,
  useLocation,
  useParams as rrUseParams,
  useSearchParams as rrUseSearchParams,
} from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (to: string) => navigate(to),
    replace: (to: string) => navigate(to, { replace: true }),
    back: () => navigate(-1),
    // WARNING: `navigate(0)` remounts the active route, which flashes/blanks the
    // page in the React Router SPA. No SPA form or operator screen may use it.
    // Use in-place React state updates or targeted re-fetches instead.
    // Full hard reloads belong only to auth-boundary exits (e.g. `window.location.assign('/login')`).
    // No operator surfaces currently call this method.
    refresh: () => navigate(0),
  };
}

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  const [params] = rrUseSearchParams();
  return params;
}

export function useParams<T extends Record<string, string>>() {
  return rrUseParams() as T;
}
