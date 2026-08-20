import { cn } from '@/lib/utils';

const GRID_BG =
  'bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40 dark:opacity-100';

/**
 * The shared operator shell. Every route under `OperatorShell` renders through
 * this so they share a single centered max-width and a single hard rule against
 * horizontal page scroll. The outer wrapper clips both axes (the rest of the
 * page lives below this shell, so `overflow-x-hidden` is the narrower claim than
 * `overflow-hidden` — `min-h-screen` plus vertical scroll is preserved); the
 * inner column constrains width to a max-width passed by the layout and pins
 * `min-w-0` so grid children can shrink instead of pushing the page wider.
 */
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
        'relative min-h-screen overflow-x-hidden bg-background p-4 font-sans text-foreground sm:p-8',
        className
      )}
    >
      <div className={cn('absolute inset-0', GRID_BG)} aria-hidden />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10"
        aria-hidden
      />
      <div
        className={cn(
          'relative z-10 mx-auto w-full max-w-5xl min-w-0',
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
