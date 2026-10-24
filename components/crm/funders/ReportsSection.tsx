// components/crm/funders/ReportsSection.tsx
// Secção "Relatórios" do detalhe de um financiador: lista, formulário de novo
// relatório e submissão (link do ficheiro) de relatórios PENDING/REJECTED.
// O estado dos dois fluxos vive aqui, não em FunderDetailView.

'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/components/crm/shared';
import { useCreateReport, useSubmitReport } from '@/hooks/useFunderActions';
import { useFormState } from '@/hooks/useFormState';
import { useToast } from '@/providers/ToastProvider';
import { EMPTY_REPORT_FORM, REPORT_COLORS } from './types';
import type { FunderDetail } from './types';

export interface ReportsSectionProps {
  funderId: string;
  reports: FunderDetail['reports'];
  /** Para associar o relatório a um grant. */
  grants: FunderDetail['grants'];
}

export function ReportsSection({
  funderId,
  reports,
  grants,
}: ReportsSectionProps) {
  const notify = useToast();
  const [showForm, setShowForm] = useState(false);
  const { values: form, set, reset } = useFormState(EMPTY_REPORT_FORM);

  // Submissão: um relatório de cada vez recebe o link do ficheiro.
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');

  const createReport = useCreateReport(funderId);
  const submitReport = useSubmitReport(funderId);

  function submitForm(e: React.FormEvent) {
    e.preventDefault();
    createReport.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        reset();
      },
    });
  }

  function cancelSubmission() {
    setSubmittingId(null);
    setFileUrl('');
  }

  function confirmSubmission(reportId: string) {
    if (!fileUrl.trim()) return;
    submitReport.mutate(
      { reportId, fileUrl: fileUrl.trim() },
      {
        onSuccess: () => {
          cancelSubmission();
          notify({ title: 'Relatório submetido.', intent: 'success' });
        },
      },
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          Relatórios ({reports.length})
        </h2>
        <Button
          onClick={() => setShowForm((s) => !s)}
          intent={showForm ? 'secondary' : 'primary'}
        >
          {showForm ? 'Cancelar' : '+ Novo Relatório'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submitForm} className="mb-4">
          <Card>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                required
                placeholder="Título"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className="md:col-span-2"
              />
              <Input
                required
                placeholder="Período (ex.: Q2 2026)"
                value={form.period}
                onChange={(e) => set('period', e.target.value)}
              />
              <div>
                <label className="font-body text-xs text-ink-muted block mb-1">
                  Prazo
                </label>
                <Input
                  required
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set('dueDate', e.target.value)}
                />
              </div>
              {grants.length > 0 && (
                <Select
                  value={form.grantId}
                  onValueChange={(value) => set('grantId', value)}
                  items={[
                    { value: '', label: 'Sem grant associado' },
                    ...grants.map((g) => ({ value: g.id, label: g.title })),
                  ]}
                />
              )}
              <div className="md:col-span-2">
                <Button type="submit" disabled={createReport.isPending}>
                  {createReport.isPending ? 'A guardar...' : 'Criar Relatório'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      <Card>
        <div className="divide-y divide-border">
          {reports.length === 0 ? (
            <p className="p-4 font-body text-ink-faint">
              Sem relatórios registados
            </p>
          ) : (
            reports.map((r) => {
              const canSubmit =
                r.status === 'PENDING' || r.status === 'REJECTED';
              const submitting = submittingId === r.id;
              return (
                <div key={r.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-body font-medium text-ink">
                        {r.title}
                      </p>
                      <p className="font-body text-xs text-ink-muted">
                        {r.period} · Prazo {formatDate(r.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                          REPORT_COLORS[r.status] ??
                            'bg-surface-sunken text-ink-muted',
                        )}
                      >
                        {r.status}
                      </span>
                      {canSubmit && !submitting && (
                        <button
                          onClick={() => setSubmittingId(r.id)}
                          className="font-body text-xs text-success-ink hover:underline"
                        >
                          Submeter
                        </button>
                      )}
                    </div>
                  </div>
                  {submitting && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Input
                        type="url"
                        placeholder="https://… link do relatório"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        className="min-w-[160px] flex-1"
                      />
                      <Button
                        size="sm"
                        disabled={!fileUrl.trim() || submitReport.isPending}
                        onClick={() => confirmSubmission(r.id)}
                      >
                        {submitReport.isPending ? 'A submeter...' : 'Confirmar'}
                      </Button>
                      <Button
                        size="sm"
                        intent="secondary"
                        onClick={cancelSubmission}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </section>
  );
}
