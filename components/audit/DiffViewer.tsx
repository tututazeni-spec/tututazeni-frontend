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
    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden text-xs font-mono">
      {Object.entries(changes).map(([key, { from, to }]) => (
        <div key={key} className="border-b border-gray-100 last:border-0">
          <div className="px-3 py-1 bg-gray-50 text-gray-600 font-semibold">
            {key}
          </div>
          <div className="px-3 py-1 bg-red-50 text-red-700">
            − {JSON.stringify(from)}
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-700">
            + {JSON.stringify(to)}
          </div>
        </div>
      ))}
    </div>
  );
}
