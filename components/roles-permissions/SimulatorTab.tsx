// components/roles-permissions/SimulatorTab.tsx
// Tab "Simulador": verificação de permissão para user/recurso/acção
// com cadeia de decisão. Extraído de
// app/(platform)/roles-permissions/page.tsx.

'use client';

import { useState } from 'react';
import { AlertTriangle, Brain, CheckCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
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
      <Card>
        <CardBody>
          <h4 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <Brain size={16} strokeWidth={1.75} className="text-accent" />
            Simulador de Permissões
          </h4>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              {
                id: 'sim-user-id',
                label: 'User ID',
                value: userId,
                set: setUserId,
                placeholder: 'Ex: 123',
              },
              {
                id: 'sim-resource',
                label: 'Recurso',
                value: resource,
                set: setResource,
                placeholder: 'Ex: reports',
              },
              {
                id: 'sim-action',
                label: 'Acção',
                value: action,
                set: setAction,
                placeholder: 'Ex: export',
              },
            ].map((f) => (
              <FormField key={f.id} label={f.label} htmlFor={f.id}>
                <Input
                  id={f.id}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full"
                />
              </FormField>
            ))}
          </div>
          <Button
            onClick={run}
            disabled={!userId || !resource || !action}
            loading={loading}
          >
            {loading ? 'A verificar…' : 'Verificar Permissão'}
          </Button>
        </CardBody>
      </Card>

      {result && (
        <div
          className={`border rounded-card p-5 ${result.allowed ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'}`}
        >
          {/* Verdict */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${result.allowed ? 'bg-success' : 'bg-danger'}`}
            >
              {result.allowed ? (
                <CheckCircle
                  size={20}
                  strokeWidth={1.75}
                  className="text-canvas"
                />
              ) : (
                <AlertTriangle
                  size={20}
                  strokeWidth={1.75}
                  className="text-canvas"
                />
              )}
            </div>
            <div>
              <p
                className={`font-bold text-lg ${result.allowed ? 'text-success-ink' : 'text-danger-ink'}`}
              >
                {result.allowed ? 'PERMITIDO' : 'NEGADO'}
              </p>
              <p className="text-xs text-ink-muted">{result.reason}</p>
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
              <div
                key={item.label}
                className="bg-surface/70 rounded-control p-2.5"
              >
                <p className="text-[10px] text-ink-faint">{item.label}</p>
                <p className="text-xs font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Decision chain */}
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
              Cadeia de Decisão
            </p>
            {(result.chain ?? []).map((s, i) => (
              <div key={i} className="flex items-center gap-3 mb-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${s.result ? 'bg-success text-canvas' : 'bg-danger text-canvas'}`}
                >
                  {s.step}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-ink">{s.check}</p>
                  <p className="text-[10px] text-ink-faint">{s.detail}</p>
                </div>
                <span
                  className={`text-[10px] font-bold ${s.result ? 'text-success' : 'text-danger'}`}
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
