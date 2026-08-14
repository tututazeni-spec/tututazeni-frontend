// components/career-plans/SimulateModal.tsx
// Simulador de carreira: escolhe um cargo alvo e mostra readiness,
// gaps e estimativa. Extraído de app/(platform)/career-plans/page.tsx.
//
// Overlay mantém-se hand-rolled (não converteu para ui/Modal/Radix
// Dialog) — o original não fecha ao clicar fora, e o Dialog do Radix
// fecharia por omissão (Escape + outside click), o que seria uma
// mudança de comportamento fora do escopo desta migração de
// apresentação. Só as classes de cor/raio/sombra foram tokenizadas.

'use client';

import { useState } from 'react';
import { AlertCircle, BookOpen, Compass, X, Zap } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { READINESS_CONFIG } from './constants';
import { SkillGapList } from './SkillGapList';
import type { ReadinessLevel, Role, SimulationResult } from './types';

interface SimulateModalProps {
  roles: Role[];
  onClose: () => void;
}

export function SimulateModal({ roles, onClose }: SimulateModalProps) {
  const [targetRoleId, setTargetRoleId] = useState(0);
  const [error, setError] = useState('');

  const simulateMutation = useApiMutation(
    (roleId: number) =>
      apiClient.post<SimulationResult>('/career-plans/simulate', {
        targetRoleId: roleId,
      }),
    { onError: (e) => setError(e.message) },
  );
  const result = simulateMutation.data ?? null;
  const loading = simulateMutation.isPending;

  const simulate = () => {
    if (!targetRoleId) {
      setError('Seleccione um cargo alvo');
      return;
    }
    setError('');
    simulateMutation.mutate(targetRoleId);
  };

  const readinessCfg = result
    ? READINESS_CONFIG[result.readiness.readinessLevel as ReadinessLevel]
    : null;

  const roleItems = roles.map((r) => ({
    value: String(r.id),
    label: `${r.name} — ${r.department} (Nível ${r.level})`,
  }));

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-panel shadow-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-ink flex items-center gap-2">
              <Compass size={18} strokeWidth={1.75} className="text-primary" />{' '}
              Simulador de Carreira
            </h2>
            <p className="font-body text-sm text-ink-muted mt-0.5">
              Veja o que é necessário para chegar ao próximo nível
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-control hover:bg-surface-sunken text-ink-muted"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-card border border-danger bg-danger-subtle text-danger-ink font-body text-sm">
              <AlertCircle size={15} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Cargo Alvo" htmlFor="simulate-target-role">
            <Select
              items={roleItems}
              value={targetRoleId ? String(targetRoleId) : undefined}
              onValueChange={(v) => {
                setTargetRoleId(+v);
                simulateMutation.reset();
              }}
              placeholder="Seleccionar..."
              className="w-full"
            />
          </FormField>

          <Button
            onClick={simulate}
            disabled={!targetRoleId}
            loading={loading}
            className="w-full"
          >
            {!loading && <Zap size={15} strokeWidth={1.75} />}
            Simular
          </Button>

          {result && readinessCfg && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className={`p-4 rounded-card border ${readinessCfg.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-ink">
                    {result.readiness.readinessEmoji} Prontidão para &quot;
                    {result.targetRole.name}&quot;
                  </p>
                  <span className={`text-xl font-bold ${readinessCfg.color}`}>
                    {result.readiness.score}%
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${readinessCfg.color}`}
                    >
                      {readinessCfg.label}
                    </span>
                    <span className="text-sm font-bold text-ink">
                      {result.readiness.score}%
                    </span>
                  </div>
                  <ProgressBar value={result.readiness.score} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="bg-surface/60 rounded-control p-2.5">
                    <p className="text-ink-faint">Estimativa</p>
                    <p className="font-bold text-ink mt-0.5">
                      {result.estimatedMonths} meses
                    </p>
                  </div>
                  <div className="bg-surface/60 rounded-control p-2.5">
                    <p className="text-ink-faint">Data prevista</p>
                    <p className="font-bold text-ink mt-0.5">
                      {new Date(result.estimatedDate).toLocaleDateString(
                        'pt-PT',
                        { month: 'short', year: 'numeric' },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {result.readiness.missingSkills.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-danger-ink mb-2">
                    Skills Obrigatórias em Falta
                  </p>
                  <SkillGapList gaps={result.readiness.missingSkills} />
                </div>
              )}

              {result.readiness.skillGaps.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-warning-ink mb-2">
                    Gaps a Desenvolver
                  </p>
                  <SkillGapList gaps={result.readiness.skillGaps} />
                </div>
              )}

              {(result.recommendedActions?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-bold text-ink-muted mb-2">
                    Cursos Recomendados
                  </p>
                  <div className="space-y-1.5">
                    {result.recommendedActions?.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer"
                      >
                        <BookOpen size={13} strokeWidth={1.75} />
                        {c.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
