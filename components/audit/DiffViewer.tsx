// components/audit/DiffViewer.tsx
// Visualizador de diff de alterações (before/after por campo).
// Extraído de app/(platform)/audit/page.tsx.

'use client';

interface DiffViewerProps {
  changes: Record<string, { from: unknown; to: unknown }>;
}

export function DiffViewer({ changes }: DiffViewerProps) {
  if (!changes || Object.keys(changes).length === 0) return null;
  return (
    <div className="mt-2 overflow-hidden rounded-control border border-border font-data text-xs">
      {Object.entries(changes).map(([key, { from, to }]) => (
        <div key={key} className="border-b border-border last:border-0">
          <div className="bg-surface-sunken px-3 py-1 font-semibold text-ink-muted">
            {key}
          </div>
          <div className="bg-danger-subtle px-3 py-1 text-danger-ink">
            − {JSON.stringify(from)}
          </div>
          <div className="bg-success-subtle px-3 py-1 text-success-ink">
            + {JSON.stringify(to)}
          </div>
        </div>
      ))}
    </div>
  );
}
