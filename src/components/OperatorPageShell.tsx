import { cn } from '@/lib/utils';

const GRID_BG =
  'bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 dark:opacity-100';

export default function OperatorPageShell({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        'relative min-h-screen overflow-hidden bg-background p-8 font-sans text-foreground',
        className
      )}
    >
      <div className={cn('absolute inset-0', GRID_BG)} aria-hidden />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
        aria-hidden
      />
      <div className={cn('relative z-10 mx-auto max-w-5xl', innerClassName)}>
        {children}
      </div>
    </div>
  );
}
