// hooks/usePdfDownload.ts
// Extraído de components/ui/PdfDownloadButton.tsx — o botão era um átomo
// de UI "reutilizável" mas fazia fetch/blob/manipulação de DOM diretamente.

'use client';

import { useState } from 'react';
import { downloadFromApi } from '@/lib/download';
import { reportError } from '@/lib/errorReporting';

export type PdfType = 'declaration' | 'certificate' | 'payslip' | 'report';

export function usePdfDownload(type: PdfType, id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);

    try {
      // Certificados têm rota própria (dados reais + ownership no backend).
      const path =
        type === 'certificate'
          ? `/certificates/${id}/pdf`
          : `/pdf/${type}/${id}`;
      await downloadFromApi(path, {
        filename: `${type}-${id}.pdf`,
        errorMessage: 'Erro ao gerar PDF',
      });
    } catch (e) {
      reportError(e, { source: 'usePdfDownload.download' });
      setError('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return { download, loading, error };
}
