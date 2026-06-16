'use client';
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface Certificate {
  id: string;
  code: string;
  title: string;
  verificationCode: string;
  publicUrl: string | null;
  isRevoked: boolean;
  issuedAt: string;
}

export default function MyCertificatesPage() {
  const [data, setData] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/certification/my-certificates`, {
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao carregar certificados');
      const json = await res.json();
      setData(json.data);
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
          <button onClick={fetchData} className="ml-4 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Os Meus Certificados</h1>
      {data.length === 0 ? (
        <p className="text-gray-400">Ainda não tens certificados emitidos.</p>
      ) : (
        <div className="grid gap-4">
          {data.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-lg shadow p-5 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{c.title}</h3>
                <p className="text-sm text-gray-500 font-mono">{c.code}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Emitido em{' '}
                  {new Date(c.issuedAt).toLocaleDateString('pt-AO')}
                  {c.isRevoked && (
                    <span className="text-red-500 ml-2">• Revogado</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/verify/${c.verificationCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Verificar
                </a>
                {!c.isRevoked && c.publicUrl && (
                  <a
                    href={c.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Descarregar
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
