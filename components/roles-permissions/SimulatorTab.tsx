// components/roles-permissions/SimulatorTab.tsx
// Tab "Simulador": verificação de permissão para user/recurso/acção
// com cadeia de decisão. Extraído de
// app/(platform)/roles-permissions/page.tsx.

'use client';

import { useState } from 'react';
import { AlertTriangle, Brain, CheckCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import type { SimulationResult } from './types';

export function SimulatorTab() {
  const [userId, setUserId] = useState('');
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');

  const simulateMutation = useApiMutation(
    (payload: { userId: number; resource: string; action: string }) =>
      apiClient.post<SimulationResult>('/roles-permissions/simulate', payload),
  );
  const result = simulateMutation.data ?? null;
  const loading = simulateMutation.isPending;

  const run = () => {
    if (!userId || !resource || !action) return;
    simulateMutation.mutate({ userId: +userId, resource, action });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Brain size={16} className="text-violet-500" />
          Simulador de Permissões
        </h4>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            {
              label: 'User ID',
              value: userId,
              set: setUserId,
              placeholder: 'Ex: 123',
            },
            {
              label: 'Recurso',
              value: resource,
              set: setResource,
              placeholder: 'Ex: reports',
            },
            {
              label: 'Acção',
              value: action,
              set: setAction,
              placeholder: 'Ex: export',
            },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs text-slate-500 mb-1 block">
                {f.label}
              </label>
              <input
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400"
              />
            </div>
          ))}
        </div>
        <button
          onClick={run}
          disabled={loading || !userId || !resource || !action}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'A verificar…' : 'Verificar Permissão'}
        </button>
      </div>

      {result && (
        <div
          className={`border rounded-xl p-5 ${result.allowed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
        >
          {/* Verdict */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${result.allowed ? 'bg-emerald-500' : 'bg-red-500'}`}
            >
              {result.allowed ? (
                <CheckCircle size={20} className="text-white" />
              ) : (
                <AlertTriangle size={20} className="text-white" />
              )}
            </div>
            <div>
              <p
                className={`font-bold text-lg ${result.allowed ? 'text-emerald-700' : 'text-red-700'}`}
              >
                {result.allowed ? 'PERMITIDO' : 'NEGADO'}
              </p>
              <p className="text-xs text-slate-600">{result.reason}</p>
            </div>
          </div>

          {/* User + Role */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Utilizador', value: result.user?.fullName },
              { label: 'Role', value: result.role?.name ?? 'Sem role' },
              { label: 'Recurso', value: result.resource },
              { label: 'Acção', value: result.action },
            ].map((item) => (
              <div key={item.label} className="bg-white/60 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-400">{item.label}</p>
                <p className="text-xs font-semibold text-slate-700">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Decision chain */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Cadeia de Decisão
            </p>
            {(result.chain ?? []).map((s, i) => (
              <div key={i} className="flex items-center gap-3 mb-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${s.result ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'}`}
                >
                  {s.step}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-700">
                    {s.check}
                  </p>
                  <p className="text-[10px] text-slate-400">{s.detail}</p>
                </div>
                <span
                  className={`text-[10px] font-bold ${s.result ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {s.result ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
