// components/automation/TemplatesTab.tsx

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_INTENT, TRIGGER_LABEL } from './constants';
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

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-1 gap-4 md:grid-cols-2"
        itemClassName="skeleton-shimmer h-32 rounded-card"
      />
    );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {templates.map((t, i) => (
        <Card key={i}>
          <CardBody>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-body text-sm font-semibold text-ink">{t.name}</p>
                {t.description && (
                  <p className="mt-0.5 font-body text-xs text-ink-faint">{t.description}</p>
                )}
              </div>
              {t.category && (
                <Badge
                  intent={CATEGORY_INTENT[t.category] ?? 'neutral'}
                  className="ml-2 shrink-0"
                >
                  {t.category}
                </Badge>
              )}
            </div>
            <div className="mb-3 flex items-center gap-2 font-body text-[10px] text-ink-faint">
              <span>{TRIGGER_LABEL[t.trigger] ?? t.trigger}</span>
              <span>→</span>
              <span className="font-data">{t.action}</span>
            </div>
            <Button size="sm" className="w-full" disabled={applying === i} onClick={() => apply(i)}>
              {applying === i ? 'A aplicar…' : 'Aplicar Template'}
            </Button>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
