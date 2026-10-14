// components/automation/TemplatesTab.tsx

import { useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ACTION_ITEMS, CATEGORY_LABEL, TRIGGER_LABEL } from './constants';
import { TEMPLATE_PALETTES, templateIcon } from './templateTheme';
import type { ApplyTemplateResponse, AutomationTemplate } from './types';

export function TemplatesTab() {
  const notify = useToast();
  const [applying, setApplying] = useState<number | null>(null);
  const { data: templates = [], isLoading: loading } = useApiQuery<
    AutomationTemplate[]
  >(queryKeys.automation.templates(), '/automation/templates', {
    staleTime: STALE_TIME.STATIC,
  });

  const apply = async (index: number) => {
    setApplying(index);
    const r = await apiClient
      .post<ApplyTemplateResponse>(`/automation/templates/${index}/apply`, {})
      .catch((e) => {
        reportError(e, { source: 'TemplatesTab.apply' });
        return null;
      });
    setApplying(null);
    if (r)
      notify({
        title: r.message ?? 'Modelo aplicado!',
        intent: 'success',
      });
    else
      notify({
        title: 'Não foi possível aplicar o modelo',
        intent: 'danger',
      });
  };

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        itemClassName="skeleton-shimmer h-72 rounded-card"
      />
    );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {templates.map((t, i) => {
        const cat = t.category?.toUpperCase() ?? '';
        const Icon = templateIcon(t);
        const c = TEMPLATE_PALETTES[i % TEMPLATE_PALETTES.length];
        return (
          <article
            key={i}
            className={`group flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-resting transition-shadow duration-150 hover:shadow-hover ${c.border}`}
          >
            <div
              className={`relative h-20 overflow-hidden bg-gradient-to-br ${c.header}`}
            >
              {t.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.imageUrl}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover mix-blend-soft-light"
                />
              ) : (
                <>
                  <div
                    className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/15"
                    aria-hidden
                  />
                  <div
                    className="absolute -bottom-10 right-24 h-24 w-24 rounded-full bg-white/10"
                    aria-hidden
                  />
                  <Icon
                    size={72}
                    strokeWidth={1.25}
                    className="absolute -bottom-2 right-5 rotate-12 text-white/25"
                    aria-hidden
                  />
                </>
              )}
              {t.category && (
                <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-0.5 font-body text-[11px] font-medium text-ink shadow-sm">
                  <span
                    className={`h-2 w-2 rounded-full ${c.dot}`}
                    aria-hidden
                  />
                  {CATEGORY_LABEL[cat] ?? t.category}
                </span>
              )}
            </div>

            <div className="relative -mt-6 flex flex-1 flex-col gap-3 px-4 pb-4">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ring-[3px] ring-surface ${c.tile}`}
                aria-hidden
              >
                <Icon size={22} strokeWidth={1.75} />
              </span>

              <div>
                <h4 className="font-display text-base font-bold leading-snug text-[#0F1F3D]">
                  {t.name}
                </h4>
                {t.description && (
                  <p className="mt-1 font-body text-xs leading-relaxed text-ink-muted">
                    {t.description}
                  </p>
                )}
              </div>

              <dl
                className={`mt-auto space-y-2 rounded-xl px-3 py-2.5 ${c.panel}`}
              >
                <div className="flex items-start gap-2.5">
                  <Zap
                    size={14}
                    strokeWidth={1.75}
                    className={`mt-0.5 shrink-0 ${c.accent}`}
                    aria-hidden
                  />
                  <dt className="w-12 shrink-0 font-body text-xs text-ink-muted">
                    Quando
                  </dt>
                  <dd className="min-w-0 break-words font-body text-xs font-semibold text-[#0F1F3D]">
                    {triggerText(t.trigger)}
                  </dd>
                </div>
                <div
                  className={`flex items-start gap-2.5 border-t pt-2.5 ${c.divider}`}
                >
                  <ArrowRight
                    size={14}
                    strokeWidth={1.75}
                    className={`mt-0.5 shrink-0 ${c.accent}`}
                    aria-hidden
                  />
                  <dt className="w-12 shrink-0 font-body text-xs text-ink-muted">
                    Então
                  </dt>
                  <dd className="min-w-0 break-words font-body text-xs font-semibold text-[#0F1F3D]">
                    {actionText(t.action)}
                  </dd>
                </div>
              </dl>

              <Button
                className={`w-full rounded-lg !bg-[#0F1F3D] !text-white hover:!bg-[#16294d]`}
                disabled={applying === i}
                onClick={() => apply(i)}
              >
                {applying === i ? 'A aplicar…' : 'Aplicar modelo'}
                {applying !== i && (
                  <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
                )}
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

const triggerText = (trigger: string) => TRIGGER_LABEL[trigger] ?? trigger;

// A API pode devolver a acção em MAIÚSCULAS (enum) — mostra sempre o rótulo PT.
const actionText = (action: string) => {
  const found = ACTION_ITEMS.find(
    (a) => a.value === action.toLowerCase(),
  )?.label;
  if (found) return found;
  const words = action.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};
