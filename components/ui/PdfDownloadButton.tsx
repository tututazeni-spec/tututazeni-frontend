// components/ui/PdfDownloadButton.tsx
'use client';

import { usePdfDownload, type PdfType } from '@/hooks/usePdfDownload';

interface PdfDownloadButtonProps {
  type: PdfType;
  id: string;
  label?: string;
  className?: string;
}

export function PdfDownloadButton({
  type,
  id,
  label = 'Exportar PDF',
  className = '',
}: PdfDownloadButtonProps) {
  const { download, loading, error } = usePdfDownload(type, id);

  return (
    <div>
      <button
        onClick={download}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-canvas text-sm font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition ${className}`}
      >
        {loading ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            A gerar...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {label}
          </>
        )}
      </button>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}
