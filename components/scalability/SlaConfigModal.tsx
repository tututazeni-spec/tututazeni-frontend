// components/scalability/SlaConfigModal.tsx
// Modal "Nova Configuração de SLA" — separador SLA & Compliance do módulo de
// Escalabilidade. Mapeado 1:1 para CreateSlaConfigDto
// (src/scalability/scalability.dto.ts) — POST /scalability/sla.
//
// SlaConfig.maxErrorRate é uma fracção 0–1 no backend; o formulário pede a
// taxa em percentagem (0–100) e converte antes de enviar, porque é assim que
// as outras métricas de erro aparecem no resto do dashboard (formatPercent).

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';

export interface SlaConfigModalProps {
  tenantId: string;
  onClose: () => void;
}

// Limites espelhados de CreateSlaConfigDto (src/scalability/scalability.dto.ts).
const LIMITS = {
  uptimePercent: { min: 90, max: 100 },
  maxLatencyMs: { min: 100 },
  maxErrorRatePercent: { min: 0, max: 100 },
  incidentResponse: { min: 1 },
} as const;

interface CreateSlaPayload {
  tenantId: string;
  name: string;
  uptimePercent?: number;
  maxLatencyMs?: number;
  maxErrorRate?: number;
  incidentResponse?: number;
  dataRetentionDays?: number;
  backupFrequency?: string;
  rpoMinutes?: number;
  rtoMinutes?: number;
}

function numInRange(raw: string, min: number, max?: number): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  if (n < min) return null;
  if (max !== undefined && n > max) return null;
  return n;
}

function optionalPositiveInt(raw: string): number | undefined | null {
  if (raw.trim() === '') return undefined;
  if (!/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= 1 ? n : null;
}

export function SlaConfigModal({ tenantId, onClose }: SlaConfigModalProps) {
  const notify = useToast();

  const [name, setName] = useState('');
  const [uptimePercent, setUptimePercent] = useState('99.9');
  const [maxLatencyMs, setMaxLatencyMs] = useState('500');
  const [maxErrorRatePercent, setMaxErrorRatePercent] = useState('1');
  const [incidentResponse, setIncidentResponse] = useState('60');
  const [dataRetentionDays, setDataRetentionDays] = useState('');
  const [backupFrequency, setBackupFrequency] = useState('');
  const [rpoMinutes, setRpoMinutes] = useState('');
  const [rtoMinutes, setRtoMinutes] = useState('');

  const createMutation = useApiMutation<unknown, CreateSlaPayload>(
    (payload) => apiClient.post('/scalability/sla', payload),
    { invalidateKeys: [queryKeys.scalability.sla(), queryKeys.scalability.dashboard()] },
  );

  const uptime = numInRange(uptimePercent, LIMITS.uptimePercent.min, LIMITS.uptimePercent.max);
  const latency = numInRange(maxLatencyMs, LIMITS.maxLatencyMs.min);
  const errorRatePct = numInRange(
    maxErrorRatePercent,
    LIMITS.maxErrorRatePercent.min,
    LIMITS.maxErrorRatePercent.max,
  );
  const response = numInRange(incidentResponse, LIMITS.incidentResponse.min);
  const retention = optionalPositiveInt(dataRetentionDays);
  const rpo = optionalPositiveInt(rpoMinutes);
  const rto = optionalPositiveInt(rtoMinutes);

  const canSubmit =
    name.trim().length > 0 &&
    uptime !== null &&
    latency !== null &&
    errorRatePct !== null &&
    response !== null &&
    retention !== null &&
    rpo !== null &&
    rto !== null &&
    !createMutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit || uptime === null || latency === null || errorRatePct === null || response === null) {
      return;
    }
    createMutation.mutate(
      {
        tenantId,
        name: name.trim(),
        uptimePercent: uptime,
        maxLatencyMs: latency,
        maxErrorRate: errorRatePct / 100,
        incidentResponse: response,
        dataRetentionDays: retention ?? undefined,
        backupFrequency: backupFrequency.trim() || undefined,
        rpoMinutes: rpo ?? undefined,
        rtoMinutes: rto ?? undefined,
      },
      {
        onSuccess: () => {
          notify({ title: `Configuração de SLA "${name.trim()}" criada`, intent: 'success' });
          onClose();
        },
        onError: (err) => {
          reportError(err, { source: 'SlaConfigModal.handleSubmit' });
          notify({ title: 'Não foi possível criar a configuração de SLA', intent: 'danger' });
        },
      },
    );
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova configuração de SLA"
        description="Define metas de uptime, latência e resposta a incidentes para este tenant."
        className="max-h-[85vh] max-w-lg overflow-y-auto"
      >
        <div className="mt-5 flex flex-col gap-4">
          <FormField label="Nome do contrato *" htmlFor="sla-name">
            <Input
              id="sla-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: SLA Enterprise 2026"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Uptime mínimo (%) *"
              htmlFor="sla-uptime"
              hint="90 a 100"
              error={
                uptime === null && uptimePercent.trim() !== ''
                  ? 'Valor entre 90 e 100.'
                  : undefined
              }
            >
              <Input
                id="sla-uptime"
                inputMode="decimal"
                value={uptimePercent}
                onChange={(e) => setUptimePercent(e.target.value)}
                placeholder="99.9"
              />
            </FormField>

            <FormField
              label="Latência máxima (ms) *"
              htmlFor="sla-latency"
              hint="≥ 100"
              error={
                latency === null && maxLatencyMs.trim() !== ''
                  ? 'Valor a partir de 100.'
                  : undefined
              }
            >
              <Input
                id="sla-latency"
                inputMode="numeric"
                value={maxLatencyMs}
                onChange={(e) => setMaxLatencyMs(e.target.value)}
                placeholder="500"
              />
            </FormField>

            <FormField
              label="Taxa de erro máxima (%) *"
              htmlFor="sla-errorrate"
              hint="0 a 100"
              error={
                errorRatePct === null && maxErrorRatePercent.trim() !== ''
                  ? 'Valor entre 0 e 100.'
                  : undefined
              }
            >
              <Input
                id="sla-errorrate"
                inputMode="decimal"
                value={maxErrorRatePercent}
                onChange={(e) => setMaxErrorRatePercent(e.target.value)}
                placeholder="1"
              />
            </FormField>

            <FormField
              label="Resposta a incidentes (min) *"
              htmlFor="sla-incident"
              hint="≥ 1"
              error={
                response === null && incidentResponse.trim() !== ''
                  ? 'Valor a partir de 1.'
                  : undefined
              }
            >
              <Input
                id="sla-incident"
                inputMode="numeric"
                value={incidentResponse}
                onChange={(e) => setIncidentResponse(e.target.value)}
                placeholder="60"
              />
            </FormField>

            <FormField
              label="Retenção de dados (dias)"
              htmlFor="sla-retention"
              hint="Opcional"
              error={retention === null && dataRetentionDays.trim() !== '' ? 'Número inteiro ≥ 1.' : undefined}
            >
              <Input
                id="sla-retention"
                inputMode="numeric"
                value={dataRetentionDays}
                onChange={(e) => setDataRetentionDays(e.target.value)}
                placeholder="365"
              />
            </FormField>

            <FormField label="Frequência de backup" htmlFor="sla-backup" hint="Opcional">
              <Input
                id="sla-backup"
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(e.target.value)}
                placeholder="Ex.: Diário"
              />
            </FormField>

            <FormField
              label="RPO (min)"
              htmlFor="sla-rpo"
              hint="Objectivo de ponto de recuperação"
              error={rpo === null && rpoMinutes.trim() !== '' ? 'Número inteiro ≥ 1.' : undefined}
            >
              <Input
                id="sla-rpo"
                inputMode="numeric"
                value={rpoMinutes}
                onChange={(e) => setRpoMinutes(e.target.value)}
                placeholder="15"
              />
            </FormField>

            <FormField
              label="RTO (min)"
              htmlFor="sla-rto"
              hint="Objectivo de tempo de recuperação"
              error={rto === null && rtoMinutes.trim() !== '' ? 'Número inteiro ≥ 1.' : undefined}
            >
              <Input
                id="sla-rto"
                inputMode="numeric"
                value={rtoMinutes}
                onChange={(e) => setRtoMinutes(e.target.value)}
                placeholder="60"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createMutation.isPending ? 'A criar…' : 'Criar SLA'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
