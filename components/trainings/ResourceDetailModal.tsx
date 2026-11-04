// components/trainings/ResourceDetailModal.tsx
// Ficha completa da sala / recurso — mesmo desenho da ficha do Formador
// (TrainerDetailModal): mostra todos os dados preenchidos em "Nova sala /
// recurso" (ResourceFormModal) e as reservas activas. Abre ao clicar no cartão.

'use client';

import type { ReactNode } from 'react';
import {
  Boxes,
  CalendarClock,
  Coins,
  Hash,
  MapPin,
  MessageSquareText,
  Tag,
  Unlock,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { STALE_TIME } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { RESOURCE_KIND_LABEL, RESOURCE_STATUS_CFG } from './constants';
import { fmtDate } from './utils';
import type { TrainingResourceItem } from './types';

export interface ResourceDetailModalProps {
  resource: TrainingResourceItem;
  onClose: () => void;
  onEdit: (resource: TrainingResourceItem) => void;
}

const NAVY = 'var(--color-brand-ink)';

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: NAVY }}
      >
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold" style={{ color: NAVY }}>
          {label}
        </div>
        <div className="break-words text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

function SectionRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `color-mix(in srgb, ${NAVY} 10%, white)`,
          color: NAVY,
        }}
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold" style={{ color: NAVY }}>
          {label}
        </div>
        <div className="mt-0.5 text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

export function ResourceDetailModal({
  resource: base,
  onClose,
  onEdit,
}: ResourceDetailModalProps) {
  const toast = useToast();
  const { data: detail } = useApiQuery<TrainingResourceItem>(
    ['training-resources', 'detail', base.id],
    `/training-resources/${base.id}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const r = { ...base, ...(detail ?? {}) };
  const bookings = detail?.bookings ?? [];
  const statusCfg = RESOURCE_STATUS_CFG[r.status];
  const isRoom = r.kind === 'ROOM';

  const release = useApiMutation(
    (bookingId: number) =>
      apiClient.post(`/training-resources/bookings/${bookingId}/release`, {}),
    {
      invalidateKeys: [
        queryKeys.trainingResources.all,
        ['training-resources', 'detail', base.id],
      ],
      onSuccess: () =>
        toast({ title: 'Recurso libertado.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={r.name}
        hideHeading
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div
          className="relative -mx-6 -mt-6 overflow-hidden px-6 py-6"
          style={{
            background: `linear-gradient(110deg, #ffffff 55%, color-mix(in srgb, ${NAVY} 12%, white) 100%)`,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-56 rotate-[28deg] rounded-[40%]"
            style={{
              background: `linear-gradient(180deg, color-mix(in srgb, ${NAVY} 55%, white), ${NAVY})`,
              opacity: 0.9,
            }}
          />
          <div className="relative flex items-center gap-5 pr-14">
            <span
              className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full p-1.5"
              style={{ background: `color-mix(in srgb, ${NAVY} 25%, white)` }}
            >
              <span
                className="flex h-full w-full items-center justify-center rounded-full text-white"
                style={{ backgroundColor: NAVY }}
              >
                {isRoom ? (
                  <MapPin size={36} strokeWidth={1.5} />
                ) : (
                  <Boxes size={36} strokeWidth={1.5} />
                )}
              </span>
            </span>
            <div className="min-w-0">
              <h2
                className="break-words font-display text-3xl font-bold"
                style={{ color: NAVY }}
              >
                {r.name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${NAVY} 10%, white)`,
                    color: NAVY,
                  }}
                >
                  <Tag size={14} strokeWidth={2} />
                  {RESOURCE_KIND_LABEL[r.kind]}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusCfg.cls}`}
                >
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-4">
            <InfoRow icon={Hash} label="Código">
              {r.code || '—'}
            </InfoRow>
            <InfoRow icon={Tag} label={isRoom ? 'Tipo de sala' : 'Categoria'}>
              {r.category || '—'}
            </InfoRow>
            <InfoRow icon={MapPin} label="Localização / Unidade">
              {r.location || '—'}
            </InfoRow>
            {isRoom ? (
              <InfoRow icon={Users} label="Capacidade">
                {r.capacity ?? '—'}
              </InfoRow>
            ) : (
              <InfoRow icon={Boxes} label="Quantidade">
                {r.quantity}
              </InfoRow>
            )}
            <InfoRow icon={Coins} label="Custo (AOA)">
              {r.cost != null ? r.cost.toLocaleString('pt-PT') : '—'}
            </InfoRow>
            <InfoRow icon={UserCog} label="Responsável">
              {r.responsible?.fullName ?? '—'}
            </InfoRow>
            <InfoRow icon={MessageSquareText} label="Observações">
              <span className="whitespace-pre-wrap">{r.notes || '—'}</span>
            </InfoRow>
          </div>

          <div
            aria-hidden
            className="hidden w-px md:block"
            style={{
              backgroundColor: `color-mix(in srgb, ${NAVY} 20%, white)`,
            }}
          />

          <div className="space-y-4">
            <SectionRow icon={Wrench} label="Equipamentos disponíveis">
              {r.equipment.length === 0 ? (
                '—'
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {r.equipment.map((e) => (
                    <span
                      key={e}
                      className="rounded-full px-3 py-0.5 text-xs text-ink"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${NAVY} 8%, white)`,
                      }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </SectionRow>
            <SectionRow icon={CalendarClock} label="Reservas activas">
              {bookings.length === 0 ? (
                <EmptyState variant="inline" title="Sem reservas activas" />
              ) : (
                <div className="space-y-1.5">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-ink-muted">
                        {b.training?.title ?? `Sessão #${b.sessionId}`} —{' '}
                        {fmtDate(b.startAt)} – {fmtDate(b.endAt)}
                      </span>
                      <Button
                        intent="ghost"
                        size="sm"
                        onClick={() => release.mutate(b.id)}
                        loading={
                          release.isPending && release.variables === b.id
                        }
                      >
                        <Unlock size={12} strokeWidth={1.75} />
                        Libertar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </SectionRow>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Fechar
          </Button>
          <Button className="flex-1 justify-center" onClick={() => onEdit(r)}>
            Editar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
