// components/departments/PositionDetailModal.tsx
// "Ao abrir um cargo" (docs/modulo_departments.md Ponto 6): descrição,
// responsabilidades, requisitos, competências, formação/experiência
// necessárias, colaboradores nesse cargo, estrutura salarial, vagas.

'use client';

import { Briefcase } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { LEVEL_CFG } from './constants';
import type { PosLevel } from './types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PositionDetail } from './types';

export interface PositionDetailModalProps {
  positionId: number;
  onClose: () => void;
}

function fmtMoney(value: number | null) {
  return value != null ? `${value.toLocaleString('pt-AO')} Kz` : '—';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

export function PositionDetailModal({ positionId, onClose }: PositionDetailModalProps) {
  const { data: p, isLoading } = useApiQuery<PositionDetail>(
    queryKeys.departments.positionDetail(positionId),
    `/positions/${positionId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={p?.name ?? 'Cargo'}
        description={p?.code ?? undefined}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {isLoading || !p ? (
          <Skeleton
            rows={6}
            wrapperClassName="mt-5 space-y-2 animate-pulse"
            itemClassName="h-10 rounded-card bg-surface-sunken"
          />
        ) : (
          <div className="mt-5 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              {p.level && (
                <Badge intent="neutral">{LEVEL_CFG[p.level as PosLevel]?.label ?? p.level}</Badge>
              )}
              <Badge intent={p.active ? 'success' : 'neutral'}>
                {p.active ? 'Activo' : 'Inactivo'}
              </Badge>
              {p.jobFamily && <Badge intent="info">{p.jobFamily}</Badge>}
            </div>

            <dl className="grid grid-cols-2 gap-4">
              <Field label="Função">{p.jobFunction ?? '—'}</Field>
              <Field label="Departamento">{p.department?.name ?? '—'}</Field>
              <Field label="Reporta a">{p.reportsTo?.name ?? '—'}</Field>
              <Field label="Criado em">
                {new Date(p.createdAt).toLocaleDateString('pt-AO')}
              </Field>
              <Field label="Posições (planeado / ocupadas / vagas)">
                {p.headcountPlanned ?? 0} / {p.headcountOccupied} / {p.vacancies}
              </Field>
              <Field label="Estrutura salarial">
                {fmtMoney(p.salaryMin)} – {fmtMoney(p.salaryMax)}
              </Field>
            </dl>

            {p.description && (
              <Field label="Descrição da função">
                <p className="whitespace-pre-wrap text-ink-muted">{p.description}</p>
              </Field>
            )}
            {p.responsibilities && (
              <Field label="Responsabilidades">
                <p className="whitespace-pre-wrap text-ink-muted">{p.responsibilities}</p>
              </Field>
            )}
            {p.requirements && (
              <Field label="Requisitos">
                <p className="whitespace-pre-wrap text-ink-muted">{p.requirements}</p>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-4">
              {p.requiredTraining && (
                <Field label="Formação necessária">{p.requiredTraining}</Field>
              )}
              {p.requiredExperience && (
                <Field label="Experiência necessária">{p.requiredExperience}</Field>
              )}
            </div>

            {p.competencies.length > 0 && (
              <Field label="Competências">
                <div className="flex flex-wrap gap-1.5">
                  {p.competencies.map((c) => (
                    <Badge key={c.competency.id} intent="warning">
                      {c.competency.name}
                    </Badge>
                  ))}
                </div>
              </Field>
            )}

            {p.subordinates.length > 0 && (
              <Field label="Cargos subordinados">
                <div className="flex flex-wrap gap-1.5">
                  {p.subordinates.map((s) => (
                    <Badge key={s.id} intent="neutral">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </Field>
            )}

            <div>
              <dt className="mb-2 text-xs uppercase tracking-wide text-ink-faint">
                Colaboradores neste cargo ({p.users.length})
              </dt>
              {p.users.length === 0 ? (
                <p className="text-sm text-ink-faint">Sem colaboradores atribuídos</p>
              ) : (
                <div className="space-y-2">
                  {p.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-2">
                      <Avatar name={u.fullName} size="sm" />
                      <div>
                        <div className="text-sm text-ink">{u.fullName}</div>
                        <div className="text-xs text-ink-faint">{u.email}</div>
                      </div>
                      {!u.active && <Badge intent="neutral">Inactivo</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {p.internalVacancies.length > 0 && (
              <div>
                <dt className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-faint">
                  <Briefcase size={13} strokeWidth={1.75} />
                  Vagas associadas
                </dt>
                <div className="space-y-1.5">
                  {p.internalVacancies.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-card border border-border p-2 text-sm"
                    >
                      <span className="text-ink">{v.title}</span>
                      <span className="text-xs text-ink-faint">
                        {v.slots} vaga(s) · {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
