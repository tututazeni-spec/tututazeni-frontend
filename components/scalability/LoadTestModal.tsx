// components/scalability/LoadTestModal.tsx
// Modal "Configurar Teste" — separador Performance do módulo de Escalabilidade.
// A página só monta o componente quando aberto, por isso o Modal fica sempre
// `open` e delega o fecho em `onClose` (X, Escape, clique fora).
//
// Valida a configuração com os mesmos limites do LoadTestConfigDto do backend
// e agenda o teste via POST /scalability/load-test (@Roles ADMIN) — o backend
// só regista o agendamento (emite um evento; a execução real do stress test
// é feita por uma ferramenta externa como k6/Locust), por isso o toast reflecte
// isso em vez de fingir que o teste já correu.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';

export interface LoadTestModalProps {
  onClose: () => void;
}

// Limites espelhados de LoadTestConfigDto (src/scalability/scalability.dto.ts).
const LIMITS = {
  concurrentUsers: { min: 1, max: 10000 },
  durationSeconds: { min: 30, max: 3600 },
} as const;

interface LoadTestVars {
  concurrentUsers: number;
  durationSeconds: number;
  rampUpSeconds?: number;
  targetEndpoint: string;
}

function intInRange(raw: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
}

export function LoadTestModal({ onClose }: LoadTestModalProps) {
  const notify = useToast();

  const [concurrentUsers, setConcurrentUsers] = useState('100');
  const [durationSeconds, setDurationSeconds] = useState('300');
  const [rampUpSeconds, setRampUpSeconds] = useState('');
  const [targetEndpoint, setTargetEndpoint] = useState('');

  const schedule = useApiMutation<{ message: string }, LoadTestVars>((vars) =>
    apiClient.post('/scalability/load-test', vars),
  );

  const users = intInRange(
    concurrentUsers,
    LIMITS.concurrentUsers.min,
    LIMITS.concurrentUsers.max,
  );
  const duration = intInRange(
    durationSeconds,
    LIMITS.durationSeconds.min,
    LIMITS.durationSeconds.max,
  );
  const rampValid =
    rampUpSeconds.trim() === '' || /^\d+$/.test(rampUpSeconds.trim());
  const ramp =
    rampUpSeconds.trim() === '' ? undefined : Number(rampUpSeconds.trim());
  const endpoint = targetEndpoint.trim();

  const canSubmit =
    users !== null &&
    duration !== null &&
    rampValid &&
    endpoint.length > 0 &&
    !schedule.isPending;

  const handleSubmit = () => {
    if (!canSubmit || users === null || duration === null) return;
    schedule.mutate(
      {
        concurrentUsers: users,
        durationSeconds: duration,
        rampUpSeconds: ramp,
        targetEndpoint: endpoint,
      },
      {
        onSuccess: (result) => {
          notify({ title: result.message, intent: 'success' });
          onClose();
        },
        onError: (err) => {
          reportError(err, { source: 'LoadTestModal.handleSubmit' });
          notify({ title: 'Não foi possível agendar o teste de carga', intent: 'danger' });
        },
      },
    );
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Configurar teste de carga"
        description="Agenda um teste de stress (executado externamente via k6/Locust). Os limites seguem os do motor de stress test."
        className="max-w-lg"
      >
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Utilizadores simultâneos *"
              htmlFor="lt-users"
              hint="1 a 10 000"
              error={
                users === null && concurrentUsers.trim() !== ''
                  ? 'Valor entre 1 e 10 000.'
                  : undefined
              }
            >
              <Input
                id="lt-users"
                inputMode="numeric"
                value={concurrentUsers}
                onChange={(e) => setConcurrentUsers(e.target.value)}
                placeholder="100"
              />
            </FormField>

            <FormField
              label="Duração (segundos) *"
              htmlFor="lt-duration"
              hint="30 a 3600"
              error={
                duration === null && durationSeconds.trim() !== ''
                  ? 'Valor entre 30 e 3600.'
                  : undefined
              }
            >
              <Input
                id="lt-duration"
                inputMode="numeric"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                placeholder="300"
              />
            </FormField>
          </div>

          <FormField
            label="Rampa de subida (segundos)"
            htmlFor="lt-ramp"
            hint="Opcional — tempo até atingir o total de utilizadores."
            error={!rampValid ? 'Indica um número de segundos (≥ 0).' : undefined}
          >
            <Input
              id="lt-ramp"
              inputMode="numeric"
              value={rampUpSeconds}
              onChange={(e) => setRampUpSeconds(e.target.value)}
              placeholder="60"
            />
          </FormField>

          <FormField
            label="Endpoint alvo *"
            htmlFor="lt-endpoint"
            hint="Rota ou padrão de URL a martelar."
          >
            <Input
              id="lt-endpoint"
              value={targetEndpoint}
              onChange={(e) => setTargetEndpoint(e.target.value)}
              placeholder="/api/courses"
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {schedule.isPending ? 'A agendar…' : 'Agendar teste'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
