// components/courses/CertificatesView.tsx
// Vista "Certificados": verificação por código + lista de
// certificados obtidos. Extraído de app/(platform)/courses/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Skeleton } from './shared';
import type { Certificate, CertificateVerifyResult } from './types';

export function CertificatesView() {
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] =
    useState<CertificateVerifyResult | null>(null);

  const { data = [], isLoading: loading } = useApiQuery<Certificate[]>(
    queryKeys.courses.myCertificates(),
    '/courses/my/certificates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  // Verificação on-demand de um código → mutação (acção pontual, não cacheada).
  const verifyMut = useApiMutation(
    (code: string) =>
      apiClient.get<CertificateVerifyResult>(
        `/courses/certificates/verify/${code}`,
      ),
    {
      onSuccess: (r) => setVerifyResult(r),
      onError: (e) => setVerifyResult({ error: e.message }),
    },
  );
  const verify = () => {
    if (verifyCode.trim()) verifyMut.mutate(verifyCode.trim());
  };

  if (loading) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* Verificar certificado */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Verificar certificado
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Código do certificado (ex: CERT-1-42-1234567890)"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={verify}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            Verificar
          </button>
        </div>
        {verifyResult && (
          <div
            className={`mt-3 p-3 rounded-lg text-sm ${verifyResult.error ? 'bg-red-50 text-red-700' : verifyResult.valid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}
          >
            {verifyResult.error
              ? `❌ ${verifyResult.error}`
              : verifyResult.valid
                ? `✅ Certificado válido — ${verifyResult.user?.fullName} — ${verifyResult.course?.title}`
                : `⚠ Certificado expirado`}
          </div>
        )}
      </div>

      {/* Meus certificados */}
      {data.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem certificados ainda. Conclua um curso para obter o seu!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data.map((cert) => (
            <div
              key={cert.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-5 text-white">
                <div className="text-xs text-blue-200 mb-1">
                  Certificado de conclusão
                </div>
                <div className="text-base font-semibold">
                  {cert.course.title}
                </div>
                <div className="text-xs text-blue-300 mt-1 font-mono">
                  {cert.code}
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Emitido: {fmtDate(cert.issuedAt)}</span>
                  {cert.expiresAt && (
                    <span
                      className={
                        new Date() > new Date(cert.expiresAt)
                          ? 'text-red-600'
                          : ''
                      }
                    >
                      Validade: {fmtDate(cert.expiresAt)}
                    </span>
                  )}
                </div>
                <button className="mt-2 w-full py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                  ⬇ Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
