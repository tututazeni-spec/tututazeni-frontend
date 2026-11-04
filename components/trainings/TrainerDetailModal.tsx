// components/trainings/TrainerDetailModal.tsx
// Ficha completa do Formador (design formadores2.jpeg) — mostra todos os
// dados preenchidos no "Novo formador" (TrainerFormModal). Abre ao clicar
// no cartão da lista.

'use client';

import type { ReactNode } from 'react';
import {
  Award,
  Briefcase,
  Building2,
  CalendarDays,
  Coins,
  Contact,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  MessageSquareText,
  Phone,
  Star,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { TRAINER_STATUS_CFG, TRAINER_TYPE_LABEL } from './constants';
import type { Trainer } from './types';

export interface TrainerDetailModalProps {
  trainer: Trainer;
  onClose: () => void;
  onEdit: (trainer: Trainer) => void;
}

const NAVY = 'var(--color-brand-ink)';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Linha da coluna esquerda: ícone cheio em azul marinho + rótulo + valor. */
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

/** Linha da coluna direita: ícone em círculo claro + título + conteúdo. */
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
      <div className="min-w-0">
        <div className="text-sm font-semibold" style={{ color: NAVY }}>
          {label}
        </div>
        <div className="mt-0.5 text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

function Lines({ value }: { value: string | null }) {
  const items = (value ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.length === 0) return <>—</>;
  return (
    <ul className="space-y-0.5">
      {items.map((i) => (
        <li key={i}>• {i}</li>
      ))}
    </ul>
  );
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return <>—</>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span
          key={i}
          className="rounded-full px-3 py-0.5 text-xs text-ink"
          style={{
            backgroundColor: `color-mix(in srgb, ${NAVY} 8%, white)`,
          }}
        >
          {i}
        </span>
      ))}
    </div>
  );
}

export function TrainerDetailModal({
  trainer: t,
  onClose,
  onEdit,
}: TrainerDetailModalProps) {
  const active = t.status === 'ACTIVE';
  const isFile = !!t.documentUrl?.startsWith('data:');
  const avatarUrl = t.user?.avatarUrl;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={t.name}
        hideHeading
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Cabeçalho: avatar, nome e etiquetas, com faixa decorativa à direita */}
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
              style={{
                background: `color-mix(in srgb, ${NAVY} 25%, white)`,
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={t.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center rounded-full text-3xl font-bold text-white"
                  style={{ backgroundColor: NAVY }}
                >
                  {initials(t.name)}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <h2
                className="break-words font-display text-3xl font-bold"
                style={{ color: NAVY }}
              >
                {t.name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${NAVY} 10%, white)`,
                    color: NAVY,
                  }}
                >
                  <User size={14} strokeWidth={2} />
                  {TRAINER_TYPE_LABEL[t.type]}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                    active
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      active ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  {TRAINER_STATUS_CFG[t.status].label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo em duas colunas */}
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-4">
            {t.type === 'INTERNAL' && (
              <InfoRow icon={UserCog} label="Colaborador associado">
                {t.user?.fullName ?? '—'}
              </InfoRow>
            )}
            <InfoRow icon={Building2} label="Entidade">
              {t.entity || '—'}
            </InfoRow>
            <InfoRow icon={Mail} label="E-mail">
              {t.email || '—'}
            </InfoRow>
            <InfoRow icon={Contact} label="NIF">
              {t.nif || '—'}
            </InfoRow>
            <InfoRow icon={Phone} label="Telefone">
              {t.phone || '—'}
            </InfoRow>
            <InfoRow icon={Coins} label="Custo/hora (AOA)">
              {t.hourlyCost != null
                ? t.hourlyCost.toLocaleString('pt-PT')
                : '—'}
            </InfoRow>
            <InfoRow icon={CalendarDays} label="Disponibilidade">
              {t.availability || '—'}
            </InfoRow>
            <InfoRow icon={FileText} label="Documentação">
              {t.documentUrl ? (
                <a
                  href={t.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline"
                >
                  <ExternalLink size={13} strokeWidth={1.75} />
                  {isFile ? 'Abrir ficheiro' : t.documentUrl}
                </a>
              ) : (
                '—'
              )}
            </InfoRow>
            <InfoRow icon={MessageSquareText} label="Observações">
              <span className="whitespace-pre-wrap">{t.notes || '—'}</span>
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
            <SectionRow icon={Star} label="Especialidades">
              <Chips items={t.specialties} />
            </SectionRow>
            <SectionRow icon={GraduationCap} label="Áreas de formação">
              <Chips items={t.trainingAreas} />
            </SectionRow>
            <SectionRow icon={Award} label="Certificações">
              <Lines value={t.certifications} />
            </SectionRow>
            <SectionRow icon={Briefcase} label="Experiência profissional">
              <Lines value={t.professionalExperience} />
            </SectionRow>
            <SectionRow icon={Users} label="Experiência como formador">
              <Lines value={t.trainerExperience} />
            </SectionRow>
          </div>
        </div>

        {t.stats && (
          <div
            className="mt-6 grid grid-cols-2 gap-3 rounded-2xl p-4 sm:grid-cols-4"
            style={{
              backgroundColor: `color-mix(in srgb, ${NAVY} 6%, white)`,
            }}
          >
            {[
              ['Formações', t.stats.trainingsAssigned],
              ['Sessões', t.stats.sessionsAssigned],
              ['Horas', t.stats.hoursMinistered],
              [
                'Avaliação',
                t.stats.avgRating ? t.stats.avgRating.toFixed(1) : '—',
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-ink-faint">{label}</div>
                <div className="text-lg font-semibold" style={{ color: NAVY }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Fechar
          </Button>
          <Button className="flex-1 justify-center" onClick={() => onEdit(t)}>
            Editar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
