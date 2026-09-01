// components/roles-permissions/SimulatorTab.tsx
// Tab "Simulador": verificação de permissão para user/recurso/acção
// com cadeia de decisão. Extraído de
// app/(platform)/roles-permissions/page.tsx.

'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
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
  // Sem esta ramificação, uma simulação falhada (User ID inexistente -> 404
  // "Utilizador não encontrado", ID não numérico -> 400) não produzia NADA no
  // painel: `mutation.data` ficava `undefined` e o único sinal era um toast
  // global genérico ("Erro ao guardar"), que passa despercebido. Resultado
  // reportado: "ao clicar em Verificar Permissão não abre nada".
  const errorMessage = simulateMutation.isError
    ? (simulateMutation.error?.message ?? 'Falha ao verificar a permissão.')
    : null;
  const invalidUserId =
    simulateMutation.isError &&
    /utilizador|user|inteiro|int|number/i.test(errorMessage ?? '');

  const run = () => {
    if (!userId || !resource || !action) return;
    simulateMutation.mutate({ userId: +userId, resource, action });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <h4 className="font-semibold text-ink mb-4">
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
                hint: 'ID numérico do utilizador (nº na ficha do colaborador)',
                invalid: invalidUserId,
              },
              {
                id: 'sim-resource',
                label: 'Recurso',
                value: resource,
                set: setResource,
                placeholder: 'Ex: reports',
                hint: undefined,
                invalid: false,
              },
              {
                id: 'sim-action',
                label: 'Acção',
                value: action,
                set: setAction,
                placeholder: 'Ex: export',
                hint: undefined,
                invalid: false,
              },
            ].map((f) => (
              <FormField
                key={f.id}
                label={f.label}
                htmlFor={f.id}
                hint={f.hint}
              >
                <Input
                  id={f.id}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  invalid={f.invalid}
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

      {errorMessage && (
        <div className="border border-danger bg-danger-subtle rounded-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-danger flex items-center justify-center shrink-0">
              <XCircle size={20} strokeWidth={1.75} className="text-canvas" />
            </div>
            <div>
              <p className="font-bold text-lg text-danger-ink">
                Não foi possível verificar
              </p>
              <p className="text-xs text-ink-muted">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {result && !simulateMutation.isError && (
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
