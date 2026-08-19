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

export function notFound(): never {
  throw new Response('Not Found', { status: 404 });
}
