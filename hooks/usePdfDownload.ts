// hooks/usePdfDownload.ts
// Extraído de components/ui/PdfDownloadButton.tsx — o botão era um átomo
// de UI "reutilizável" mas fazia fetch/blob/manipulação de DOM diretamente.

'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/api';

export type PdfType = 'declaration' | 'certificate' | 'payslip' | 'report';

export function usePdfDownload(type: PdfType, id: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/pdf/${type}/${id}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Erro ao gerar PDF');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Criar link temporário e clicar
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return { download, loading, error };
}
