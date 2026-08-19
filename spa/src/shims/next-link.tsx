import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';

type NavigateEvent = { preventDefault: () => void };

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
  replace?: boolean;
  onNavigate?: (event: NavigateEvent) => void;
};

export default function Link({ href, replace, children, onNavigate, onClick, ...rest }: Props) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!onNavigate || event.defaultPrevented) return;
    onNavigate({
      preventDefault: () => event.preventDefault(),
    });
  };
  return (
    <RouterLink
      to={href}
      replace={replace}
      onClick={handleClick}
      {...(rest as Omit<RouterLinkProps, 'to'>)}
    >
      {children}
    </RouterLink>
  );
}
