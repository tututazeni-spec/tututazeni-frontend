// components/ai-tutor/SettingsView.tsx
// Vista "Configurações" (docs/ai-tutor.md secção 8). Persistido em
// AiTutorSettings (singleton) e aplicado em cada chamada ao tutor
// (buildSystemPrompt, sendMessage, generateContent) — não é decorativo.

'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AiTutorSettingsData } from './types';

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 py-3 border-b border-border last:border-0 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border-strong accent-primary flex-shrink-0"
      />
      <div>
        <div className="font-body text-sm font-medium text-ink">{label}</div>
        <div className="font-body text-xs text-ink-faint">{description}</div>
      </div>
    </label>
  );
}

export function SettingsView() {
  const notify = useToast();
  const confirm = useConfirm();
  const { data, isLoading: loading } = useApiQuery<AiTutorSettingsData>(
    queryKeys.aiTutor.settings(),
    '/ai-tutor/settings',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const [form, setForm] = useState<AiTutorSettingsData | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useApiMutation(
    (payload: Partial<AiTutorSettingsData>) =>
      apiClient.patch<AiTutorSettingsData>('/ai-tutor/settings', payload),
    {
      invalidateKeys: [queryKeys.aiTutor.settings()],
      onSuccess: () => notify({ title: 'Configurações guardadas', intent: 'success' }),
      onError: (e) => {
        reportError(e, { source: 'SettingsView.save' });
        notify({ title: e.message, intent: 'danger' });
      },
    },
  );

  const purgeMutation = useApiMutation(
    () => apiClient.post<{ purged: number; message?: string }>('/ai-tutor/settings/purge-history'),
    {
      onSuccess: (res) =>
        notify({
          title:
            res.purged > 0
              ? `${res.purged} sessão(ões) antiga(s) eliminada(s)`
              : (res.message ?? 'Nada para eliminar'),
          intent: 'success',
        }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const handlePurge = async () => {
    if (
      await confirm({
        title: 'Eliminar histórico antigo?',
        message:
          'Elimina permanentemente sessões (e mensagens) mais antigas que os dias de retenção configurados.',
        confirmLabel: 'Eliminar',
        destructive: true,
      })
    ) {
      purgeMutation.mutate(undefined);
    }
  };

  if (loading || !form)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  return (
    <div className="space-y-5 max-w-2xl">
      <Card className="p-5">
        <div className="font-body text-sm font-semibold text-ink mb-1">Base de conhecimento</div>
        <ToggleRow
          label="Responder apenas com fontes autorizadas"
          description='"Responder apenas com informação encontrada nas fontes autorizadas" — desactiva o conhecimento geral do modelo.'
          checked={form.sourceOnlyMode}
          onChange={(v) => setForm({ ...form, sourceOnlyMode: v })}
        />
        <ToggleRow
          label="Permitir respostas fora da base de conhecimento"
          description="Quando a base de conhecimento não tiver informação suficiente, a Ísis pode complementar com conhecimento geral."
          checked={form.allowOutsideKnowledge}
          onChange={(v) => setForm({ ...form, allowOutsideKnowledge: v })}
        />
        <ToggleRow
          label="Respostas com fontes"
          description='Incluir "Fonte: ..." nas respostas que usam a Base de Conhecimento.'
          checked={form.showSources}
          onChange={(v) => setForm({ ...form, showSources: v })}
        />
      </Card>

      <Card className="p-5">
        <div className="font-body text-sm font-semibold text-ink mb-3">Modelo &amp; limites</div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-body text-xs text-ink-muted mb-1 block">
              Temperatura (0 = preciso, 1 = criativo)
            </label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="font-body text-xs text-ink-muted mb-1 block">Idioma</label>
            <Input
              value={form.defaultLanguage}
              onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value })}
            />
          </div>
          <div>
            <label className="font-body text-xs text-ink-muted mb-1 block">
              Limite diário de perguntas (por colaborador)
            </label>
            <Input
              type="number"
              min={1}
              placeholder="Sem limite"
              value={form.dailyMessageLimit ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  dailyMessageLimit: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <div>
            <label className="font-body text-xs text-ink-muted mb-1 block">
              Retenção do histórico (dias)
            </label>
            <Input
              type="number"
              min={1}
              placeholder="Sem limite"
              value={form.historyRetentionDays ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  historyRetentionDays: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
        </div>

        <label className="font-body text-xs text-ink-muted mb-1 block">
          Prompt adicional da Academia
        </label>
        <Textarea
          value={form.customSystemPromptAddendum ?? ''}
          onChange={(e) => setForm({ ...form, customSystemPromptAddendum: e.target.value })}
          placeholder="Ex: nunca comentes assuntos salariais individuais…"
          rows={3}
          className="w-full"
        />
      </Card>

      <div className="flex items-center justify-between">
        <Button
          intent="danger"
          onClick={handlePurge}
          loading={purgeMutation.isPending}
          disabled={!form.historyRetentionDays}
        >
          <Trash2 size={14} strokeWidth={1.75} />
          Purgar histórico antigo agora
        </Button>
        <Button onClick={() => saveMutation.mutate(form)} loading={saveMutation.isPending}>
          Guardar configurações
        </Button>
      </div>
    </div>
  );
}
