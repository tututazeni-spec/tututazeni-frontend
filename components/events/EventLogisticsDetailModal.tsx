// components/events/EventLogisticsDetailModal.tsx
// Ficha (só leitura) da logística guardada para um evento, aberta ao clicar no
// cartão do evento em "Locais & Logística". Mesmo desenho do modal de detalhe
// da aba "Avaliações" (DetailHeader + duas colunas).

'use client';

import {
  Banknote,
  Boxes,
  CalendarDays,
  ClipboardList,
  MapPin,
  Truck,
  UserRound,
  Wallet,
} from 'lucide-react';
import { Modal, ModalContent } from '@/components/ui/Modal';
import {
  DetailDivider,
  DetailHeader,
  DetailInfoRow,
  DetailSectionRow,
} from '@/components/ui/DetailCardParts';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime, formatKz } from '@/lib/format';
import { EQUIPMENT_CFG, LOGISTICS_STATUS_CFG } from './constants';
import type { Event, EventLogistics } from './types';

type FixedServiceKey =
  'catering' | 'transport' | 'accommodation' | 'security' | 'decoration';

const FIXED_SERVICES: Array<{ key: FixedServiceKey; label: string }> = [
  { key: 'catering', label: 'Catering' },
  { key: 'transport', label: 'Transporte' },
  { key: 'accommodation', label: 'Alojamento' },
  { key: 'security', label: 'Segurança' },
  { key: 'decoration', label: 'Decoração' },
];

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
      {children}
    </span>
  );
}

const lines = (t: string | null | undefined) =>
  (t ?? '')
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);

export interface EventLogisticsDetailModalProps {
  event: Event;
  logistics: EventLogistics | null | undefined;
  onClose: () => void;
}

export function EventLogisticsDetailModal({
  event,
  logistics,
  onClose,
}: EventLogisticsDetailModalProps) {
  const equipment = logistics
    ? [
        ...logistics.equipment.map((e) => EQUIPMENT_CFG[e]?.label ?? e),
        ...(logistics.customEquipment ?? []),
      ]
    : [];
  const resources = lines(logistics?.resourcesNeeded);
  const suppliers = lines(logistics?.suppliers);
  const costs = logistics?.serviceCosts ?? {};
  const hasCost = (key: string) =>
    costs[key] !== null && costs[key] !== undefined;
  const cost = (key: string) =>
    hasCost(key) ? formatKz(Number(costs[key])) : null;

  const services = logistics
    ? [
        ...FIXED_SERVICES.filter((s) => logistics[s.key] || hasCost(s.key)).map(
          (s) => ({
            label: s.label,
            note: logistics[s.key],
            cost: cost(s.key),
          }),
        ),
        ...(logistics.customServices ?? []).map((name) => ({
          label: name,
          note: null as string | null,
          cost: cost(name),
        })),
      ]
    : [];

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Logística — ${event.title}`}
        hideHeading
        navyClose
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
      >
        <DetailHeader
          name={event.title}
          subtitle={[event.location, event.room].filter(Boolean).join(' · ')}
        >
          {logistics && (
            <StatusBadge
              value={logistics.status}
              map={LOGISTICS_STATUS_CFG}
              variant="pill"
            />
          )}
        </DetailHeader>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-4">
            <DetailInfoRow icon={CalendarDays} label="Data">
              {event.startAt ? formatDateTime(event.startAt) : '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={MapPin} label="Local">
              {[event.location, event.room, event.address]
                .filter(Boolean)
                .join(' · ') || '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={UserRound} label="Responsável">
              {logistics?.responsible?.fullName ?? '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={Wallet} label="Orçamento">
              {logistics?.budget != null ? formatKz(logistics.budget) : '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={Banknote} label="Custo real">
              {logistics?.actualCost != null
                ? formatKz(logistics.actualCost)
                : '—'}
            </DetailInfoRow>
          </div>

          <DetailDivider />

          <div className="space-y-5">
            {!logistics && (
              <p className="text-sm text-ink-muted">
                Ainda não há logística guardada para este evento.
              </p>
            )}
            <DetailSectionRow
              icon={Boxes}
              label={`Equipamentos (${equipment.length})`}
            >
              {equipment.length === 0 ? (
                '—'
              ) : (
                <div className="flex flex-wrap gap-2">
                  {equipment.map((e) => (
                    <Pill key={e}>{e}</Pill>
                  ))}
                </div>
              )}
            </DetailSectionRow>
            <DetailSectionRow
              icon={ClipboardList}
              label={`Recursos necessários (${resources.length})`}
            >
              {resources.length === 0 ? (
                '—'
              ) : (
                <div className="flex flex-wrap gap-2">
                  {resources.map((r) => (
                    <Pill key={r}>{r}</Pill>
                  ))}
                </div>
              )}
            </DetailSectionRow>
            <DetailSectionRow
              icon={Truck}
              label={`Fornecedores e serviços (${suppliers.length + services.length})`}
            >
              {suppliers.length + services.length === 0 ? (
                '—'
              ) : (
                <ul className="space-y-1">
                  {suppliers.map((s) => (
                    <li key={s}>
                      <span className="font-medium">Fornecedor:</span> {s}
                    </li>
                  ))}
                  {services.map((s) => (
                    <li key={s.label}>
                      <span className="font-medium">{s.label}</span>
                      {s.note ? `: ${s.note}` : ''}
                      {s.cost ? ` — ${s.cost}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </DetailSectionRow>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
