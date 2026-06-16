'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export default function VerifyCertificatePage() {
  const params = useParams();
  const code = params?.code as string;
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`${API}/certification/verify/${code}`);
        const json = await res.json();
        setResult(json);
      } catch {
        setResult({ valid: false, reason: 'Erro ao verificar' });
      } finally {
        setLoading(false);
      }
    }
    if (code) verify();
  }, [code]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {result?.valid ? (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-700 mb-2">
              Certificado Válido
            </h1>
            <p className="text-gray-500 mb-6">
              Este certificado é autêntico e foi emitido pela INNOVA
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
              <div>
                <span className="text-xs text-gray-400 uppercase">Titular</span>
                <p className="font-semibold">{result.certificate.holder}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase">
                  Certificado
                </span>
                <p className="font-semibold">{result.certificate.title}</p>
              </div>
              {result.certificate.score != null && (
                <div>
                  <span className="text-xs text-gray-400 uppercase">Nota</span>
                  <p className="font-semibold">{result.certificate.score}%</p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-400 uppercase">
                  Emitido em
                </span>
                <p className="font-semibold">
                  {new Date(result.certificate.issuedAt).toLocaleDateString(
                    'pt-AO',
                  )}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-400 uppercase">
                  Código de Verificação
                </span>
                <p className="font-mono text-sm">
                  {result.certificate.verificationCode}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">
              Certificado Inválido
            </h1>
            <p className="text-gray-600">{result?.reason}</p>
            {result?.revokeReason && (
              <p className="text-sm text-gray-400 mt-4">
                Motivo: {result.revokeReason}
              </p>
            )}
          </>
        )}
        <p className="text-xs text-gray-300 mt-8">
          INNOVA — Verificação de Certificados
        </p>
      </div>
    </div>
  );
}
