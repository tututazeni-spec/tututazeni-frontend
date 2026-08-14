// components/competency-map/SelfAssessModal.tsx
// Modal de autoavaliação em lote de competências. Extraído de
// app/(platform)/competency-map/page.tsx.

'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { TYPE_CONFIG } from './constants';
import type { SkillType } from './types';

interface SelfAssessModalProps {
  skills: Array<{
    id: number;
    name: string;
    type: SkillType;
    maxLevel: number;
  }>;
  onClose: () => void;
  onSuccess: () => void;
}

export function SelfAssessModal({
  skills,
  onClose,
  onSuccess,
}: SelfAssessModalProps) {
  const [levels, setLevels] = useState<Record<number, number>>({});
  const [error, setError] = useState('');

  const submitAssessments = useApiMutation(
    (assessments: Array<{ skillId: number; currentLevel: number }>) =>
      apiClient.post('/competency-map/assess/batch', {
        source: 'SELF',
        assessments,
      }),
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setError(e.message),
    },
  );
  const loading = submitAssessments.isPending;

  const handleSubmit = () => {
    const assessments = Object.entries(levels)
      .filter(([_, v]) => v > 0)
      .map(([skillId, currentLevel]) => ({ skillId: +skillId, currentLevel }));
    if (!assessments.length) {
      setError('Avalie pelo menos uma competência');
      return;
    }
    setError('');
    submitAssessments.mutate(assessments);
  };

  const byType = skills.reduce<Record<string, typeof skills>>((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-panel shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-ink">
              Autoavaliação de Competências
            </h2>
            <p className="text-sm text-ink-muted mt-0.5">
              Avalie o seu nível actual em cada competência (1 = Iniciante · 5 =
              Expert)
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

        <div className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-control text-sm">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {Object.entries(byType).map(([type, typeSkills]) => {
            const cfg = TYPE_CONFIG[type as SkillType];
            return (
              <div key={type}>
                <div
                  className={`inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} mb-3`}
                >
                  {cfg.label}
                </div>
                <div className="space-y-4">
                  {typeSkills.map((s) => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-ink">
                          {s.name}
                        </span>
                        <span className="text-sm font-bold text-primary">
                          {levels[s.id] ?? 0}/{s.maxLevel}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {Array.from(
                          { length: s.maxLevel },
                          (_, i) => i + 1,
                        ).map((l) => (
                          <button
                            key={l}
                            onClick={() =>
                              setLevels((prev) => ({ ...prev, [s.id]: l }))
                            }
                            className={`flex-1 h-8 rounded-control text-sm font-semibold transition-all ${
                              (levels[s.id] ?? 0) >= l
                                ? 'bg-primary text-canvas shadow-resting'
                                : 'bg-surface-sunken text-ink-faint hover:bg-border-strong'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSubmit} disabled={loading} loading={loading}>
            {!loading && <CheckCircle2 size={14} strokeWidth={1.75} />}
            Submeter Avaliação
          </Button>
        </div>
      </div>
    </div>
  );
}
