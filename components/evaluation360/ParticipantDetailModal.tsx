// components/evaluation360/ParticipantDetailModal.tsx
// "Ao abrir um colaborador" (docs/evaluation360.md §4): dados do
// colaborador, competências avaliadas, avaliadores, progresso, resultados,
// comentários e comparação entre perspectivas. Aberto a partir de uma linha
// de AvaliadosTab. `result` só vem preenchido pelo backend para ADMIN/RH
// (evaluation360.service.ts#getParticipantDetailForAdmin) — GESTOR/LIDER/
// DIRECTOR veem o resto do ecrã (perfil, competências, avaliadores,
// progresso, comentários) sem o resultado agregado.

'use client';

import type { ParticipantDetail } from './types';
import { participantStatusLabel, evaluatorAssignmentStatusLabel, evaluatorRoleLabel } from './colors';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Modal, ModalContent } from '@/components/ui/Modal';

export interface ParticipantDetailModalProps {
  cycleId: string;
  userId: string;
  onClose: () => void;
}

export function ParticipantDetailModal({ cycleId, userId, onClose }: ParticipantDetailModalProps) {
  const { data, isLoading } = useApiQuery<ParticipantDetail>(
    queryKeys.evaluation360.participantDetail(cycleId, userId),
    `/evaluation360/cycles/${cycleId}/participants/${userId}/detail`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={data?.profile.fullName ?? 'Avaliado'}
        description="Perfil, competências avaliadas, avaliadores, progresso e resultados"
        className="max-w-2xl"
      >
        {isLoading && <div className="mt-4 text-sm text-ink-muted">A carregar…</div>}

        {data && (
          <div className="mt-4 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Avatar name={data.profile.fullName} url={data.profile.avatarUrl ?? undefined} size="lg" />
              <div>
                <div className="font-bold text-ink">{data.profile.fullName}</div>
                <div className="text-sm text-ink-muted">
                  {[data.profile.position, data.profile.department].filter(Boolean).join(' · ') || '—'}
                </div>
                {data.profile.managerName && (
                  <div className="text-xs text-ink-muted">Gestor: {data.profile.managerName}</div>
                )}
              </div>
              <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-surface-sunken text-ink">
                {participantStatusLabel[data.status] ?? data.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Avaliadores atribuídos" value={data.progress.totalAssigned} />
              <Stat label="Concluídas" value={data.progress.completed} />
              <Stat label="Progresso" value={`${data.progress.completionPercent}%`} />
            </div>

            <section>
              <h3 className="m-0 mb-2 text-sm font-bold text-ink">Competências avaliadas</h3>
              {Object.keys(data.competencies).length === 0 ? (
                <p className="m-0 text-sm text-ink-muted">Ainda sem respostas submetidas.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {Object.entries(data.competencies).map(([id, c]) => (
                    <div
                      key={id}
                      className="flex justify-between items-center rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="text-ink">{c.name}</span>
                      <span className="font-semibold text-ink">
                        {c.score !== null ? c.score.toFixed(1) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="m-0 mb-2 text-sm font-bold text-ink">Avaliadores</h3>
              <div className="flex flex-col gap-1.5">
                {data.evaluators.map((e) => (
                  <div
                    key={e.id}
                    className="flex justify-between items-center rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="text-ink font-medium">{e.evaluatorName}</span>
                      <span className="text-ink-muted"> — {evaluatorRoleLabel[e.role] ?? e.role}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-sunken text-ink">
                      {evaluatorAssignmentStatusLabel[e.status] ?? e.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {data.result ? (
              <section>
                <h3 className="m-0 mb-2 text-sm font-bold text-ink">
                  Resultado — comparação entre perspectivas
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Global" value={data.result.weightedScore.toFixed(1)} />
                  <Stat label="Autoavaliação" value={data.result.selfScore?.toFixed(1) ?? '—'} />
                  <Stat label="Gestor" value={data.result.managerScore?.toFixed(1) ?? '—'} />
                  <Stat label="Pares" value={data.result.peerScore?.toFixed(1) ?? '—'} />
                </div>
                {data.result.gaps.length > 0 && (
                  <p className="m-0 mt-3 text-xs text-ink-muted">
                    Maiores gaps: {data.result.gaps.map((g) => g.name).join(', ')}
                  </p>
                )}
              </section>
            ) : (
              <p className="m-0 text-xs text-ink-faint">
                Resultado consolidado disponível apenas para ADMIN/RH.
              </p>
            )}

            {data.comments.length > 0 && (
              <section>
                <h3 className="m-0 mb-2 text-sm font-bold text-ink">Comentários</h3>
                <div className="flex flex-col gap-2">
                  {data.comments.map((c, i) => (
                    <div key={i} className="rounded-lg border border-border px-3 py-2 text-sm">
                      <div className="text-xs text-ink-muted mb-1">
                        {evaluatorRoleLabel[c.evaluatorRole] ?? c.evaluatorRole} · {c.question}
                      </div>
                      <div className="text-ink">{c.text}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface-sunken px-3 py-2.5">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="text-base font-bold text-ink">{value}</div>
    </div>
  );
}
