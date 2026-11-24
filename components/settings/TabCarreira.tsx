// components/settings/TabCarreira.tsx
// Tab "Carreira" (ADMIN): limiares dos Critérios de Promoção
// (GET/PUT /settings/career). Usados pelo backend em
// checkPromotionEligibility e mostrados em Carreira → A Minha Carreira.

'use client';

import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useServerDraft } from '@/hooks/useServerDraft';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CareerSettings } from './types';

export function TabCarreira() {
  const toast = useToast();

  const { data, isLoading, error } = useApiQuery<CareerSettings>(
    queryKeys.settings.career(),
    '/settings/career',
  );
  const [form, setForm] = useServerDraft<CareerSettings>(data);

  const save = useApiMutation(
    (payload: CareerSettings) => apiClient.put('/settings/career', payload),
    {
      invalidateKeys: [queryKeys.settings.career(), queryKeys.career.all],
      onSuccess: () =>
        toast({
          title: 'Critérios de promoção guardados',
          intent: 'success',
        }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading || !form) return <Skeleton rows={4} />;
  if (error)
    return (
      <p className="py-10 text-center text-sm text-danger">{error.message}</p>
    );

  const set = (patch: Partial<CareerSettings>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));

  const invalidReady = form.readyIn12mCompetenciesPct > form.minCompetenciesPct;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalidReady) save.mutate(form);
      }}
    >
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand-dark text-xs font-medium text-white uppercase tracking-wide">
          Critérios de promoção
        </div>
        <CardBody>
          <p className="mb-4 text-sm text-ink-muted">
            Valores mínimos para um colaborador ser considerado elegível para
            promoção. Aplicam-se a toda a organização.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              label="Meses no cargo"
              htmlFor="minMonthsInRole"
              hint="Contados desde a data de admissão"
            >
              <Input
                id="minMonthsInRole"
                type="number"
                min={0}
                max={240}
                step={1}
                className="w-full"
                value={form.minMonthsInRole}
                onChange={(e) =>
                  set({ minMonthsInRole: Number(e.target.value) })
                }
              />
            </FormField>
            <FormField
              label="Score de performance"
              htmlFor="minPerformanceScore"
              hint="Média das avaliações, de 0 a 5"
            >
              <Input
                id="minPerformanceScore"
                type="number"
                min={0}
                max={5}
                step={0.1}
                className="w-full"
                value={form.minPerformanceScore}
                onChange={(e) =>
                  set({ minPerformanceScore: Number(e.target.value) })
                }
              />
            </FormField>
            <FormField
              label="% de competências cumpridas"
              htmlFor="minCompetenciesPct"
              hint="Das competências exigidas pelo cargo"
            >
              <Input
                id="minCompetenciesPct"
                type="number"
                min={0}
                max={100}
                step={1}
                className="w-full"
                value={form.minCompetenciesPct}
                onChange={(e) =>
                  set({ minCompetenciesPct: Number(e.target.value) })
                }
              />
            </FormField>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              label="% para «pronto em 12 meses»"
              htmlFor="readyIn12mCompetenciesPct"
              hint="Com a performance cumprida, a partir desta % de competências a recomendação passa a «pronto em 12 meses»"
              error={
                invalidReady
                  ? 'Não pode ser superior à % exigida para elegibilidade'
                  : undefined
              }
            >
              <Input
                id="readyIn12mCompetenciesPct"
                type="number"
                min={0}
                max={100}
                step={1}
                className="w-full"
                value={form.readyIn12mCompetenciesPct}
                onChange={(e) =>
                  set({ readyIn12mCompetenciesPct: Number(e.target.value) })
                }
              />
            </FormField>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={save.isPending || invalidReady}>
              {save.isPending ? 'A guardar…' : 'Guardar alterações'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
