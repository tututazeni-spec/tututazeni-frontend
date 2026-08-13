// components/notifications/AdminView.tsx
// Vista apresentacional da administração de notificações — sem fetch, sem
// mutações (tudo isso vem do container, hooks/useNotificationsAdmin.ts, usado
// em AdminView dentro de app/(platform)/notifications/page.tsx).
// Ver memory project_innova_component_separation_audit, item 3.6.

'use client';

import type { Dispatch, SetStateAction } from 'react';
import { BellRing, CheckCircle2, Percent, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Textarea } from '@/components/ui/Textarea';
import { CATEGORY_CFG, Skeleton } from './shared';
import type { AdminForm, Stats } from './types';

export interface AdminViewProps {
  stats: Stats | undefined;
  loading: boolean;
  form: AdminForm;
  setForm: Dispatch<SetStateAction<AdminForm>>;
  sending: boolean;
  handleSendAll: () => void;
}

export function AdminView({
  stats,
  loading,
  form,
  setForm,
  sending,
  handleSendAll,
}: AdminViewProps) {
  if (loading || !stats) return <Skeleton rows={3} />;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard icon={Send} label="Total enviadas" value={stats.total} intent="primary" />
        <KpiCard icon={CheckCircle2} label="Lidas" value={stats.read} intent="success" />
        <KpiCard
          icon={BellRing}
          label="Não lidas"
          value={stats.unread}
          intent={stats.unread > 100 ? 'danger' : 'warning'}
        />
        <KpiCard
          icon={Percent}
          label="Taxa de abertura"
          value={`${stats.openRate}%`}
          intent="info"
        />
      </div>

      {/* Por categoria */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Por categoria
          </div>
          {stats.byCategory.map((c) => {
            const cfg = c.category ? CATEGORY_CFG[c.category] : null;
            return (
              <div
                key={c.category}
                className="flex items-center gap-2 border-b border-border py-1.5 last:border-0"
              >
                <span className="text-sm">{cfg?.icon ?? '📌'}</span>
                <span className="flex-1 font-body text-xs text-ink-muted">
                  {cfg?.label ?? c.category ?? '—'}
                </span>
                <span className="font-data text-xs font-bold text-ink">
                  {c.count}
                </span>
              </div>
            );
          })}
        </Card>

        {/* Envio em massa */}
        <Card className="p-4">
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Enviar a todos
          </div>
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Título (opcional)"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              className="w-full"
            />
            <Textarea
              rows={3}
              placeholder="Mensagem…"
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              className="w-full resize-none"
            />
            <Button className="w-full" disabled={sending} onClick={handleSendAll}>
              {sending ? 'A enviar…' : '📣 Enviar a todos os colaboradores'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
