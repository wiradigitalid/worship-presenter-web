import type { ReactNode } from 'react';

export default function SettingsRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 py-4 border-b border-border/60 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{title}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex items-end gap-2 shrink-0">{children}</div>
    </div>
  );
}
