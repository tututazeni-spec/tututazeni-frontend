// components/automation/TemplatesTab.tsx

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton, CATEGORY_COLOR, TRIGGER_LABEL } from './atoms';
import type { ApplyTemplateResponse, AutomationTemplate } from './types';

export function TemplatesTab() {
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
      .catch(() => null);
    setApplying(null);
    if (r) alert(r.message ?? 'Template aplicado!');
  };

  if (loading) return <Skeleton />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((t, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-100 p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">{t.name}</p>
              {t.description && (
                <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
              )}
            </div>
            {t.category && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2 ${CATEGORY_COLOR[t.category] ?? CATEGORY_COLOR.CUSTOM}`}
              >
                {t.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-3">
            <span>{TRIGGER_LABEL[t.trigger] ?? t.trigger}</span>
            <span>→</span>
            <span className="font-mono">{t.action}</span>
          </div>
          <button
            onClick={() => apply(i)}
            disabled={applying === i}
            className="w-full text-xs py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {applying === i ? 'A aplicar…' : 'Aplicar Template'}
          </button>
        </div>
      ))}
    </div>
  );
}
