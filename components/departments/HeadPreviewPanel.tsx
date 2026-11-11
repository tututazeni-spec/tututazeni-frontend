// components/departments/HeadPreviewPanel.tsx
// Cartão de resumo de um responsável (aba Responsáveis), no mesmo desenho do
// painel que aparece em Estrutura organizacional ao clicar num departamento.

'use client';

import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  GitBranch,
  Mail,
  UserCog,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatDateNumeric } from '@/lib/format';
import { HeaderIllustration, PreviewField } from './StructureView';
import type { HeadRow } from './types';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  ARCHIVED: 'Arquivado',
};

const ACTION_BUTTON =
  'mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-panel text-base font-semibold transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

interface HeadPreviewPanelProps {
  row: HeadRow;
  onViewDetail: (departmentId: number) => void;
  onChangeHead?: (row: HeadRow) => void;
  onClose: () => void;
}

export function HeadPreviewPanel({
  row,
  onViewDetail,
  onChangeHead,
  onClose,
}: HeadPreviewPanelProps) {
  const name = row.head?.fullName ?? 'Por atribuir';
  return (
    <aside
      aria-label={`Resumo de ${name}`}
      className="sticky top-4 self-start overflow-hidden rounded-[24px] border border-brand-line bg-brand-soft shadow-[0_8px_24px_rgba(15,31,61,0.10)]"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-brand to-[#0756D9] px-5 pt-5 sm:h-52">
        <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#078BFF]/20" />
        <span className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rotate-45 rounded-panel bg-white/5" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
        <div className="relative flex items-center gap-3 pr-8">
          {row.head ? (
            <Avatar name={row.head.fullName} size="md" />
          ) : (
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#078BFF] text-white">
              <UserRound size={24} strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0">
            <div className="break-words text-xl font-bold leading-tight text-white">
              {name}
            </div>
            <div className="mt-0.5 text-sm tracking-wider text-[#BFDBFF]">
              {row.position ?? 'Responsável'}
            </div>
          </div>
        </div>
        <div className="absolute -bottom-2 right-2 h-28 w-36 sm:h-32 sm:w-40">
          <HeaderIllustration />
        </div>
      </div>

      <div className="relative -mt-5 rounded-t-[24px] bg-surface px-5 pb-5 pt-2">
        <dl>
          <PreviewField icon={Building2} label="Departamento">
            {row.departmentName}
          </PreviewField>
          <PreviewField icon={UserCog} label="Substituto">
            {row.deputyHead?.fullName ?? '—'}
          </PreviewField>
          <PreviewField icon={CalendarDays} label="Responsável desde">
            {row.startedAt ? formatDateNumeric(row.startedAt) : '—'}
          </PreviewField>
          <PreviewField icon={Briefcase} label="Estado">
            {STATUS_LABEL[row.status] ?? row.status}
          </PreviewField>
          <PreviewField icon={Mail} label="Contacto">
            {row.contact ?? row.head?.email ?? '—'}
          </PreviewField>
          <PreviewField icon={Users} label="Colaboradores">
            {row.usersUnderResponsibility}
          </PreviewField>
          <PreviewField icon={GitBranch} label="Subdepartamentos">
            {row.subdepartmentsUnderResponsibility}
          </PreviewField>
        </dl>

        <button
          type="button"
          onClick={() => onViewDetail(row.departmentId)}
          className={`${ACTION_BUTTON} bg-brand text-white`}
        >
          Ver detalhe completo
          <ArrowRight size={20} strokeWidth={2} />
        </button>
        {onChangeHead && (
          <button
            type="button"
            onClick={() => onChangeHead(row)}
            className={`${ACTION_BUTTON} border border-brand bg-surface text-brand`}
          >
            <UserCog size={18} strokeWidth={1.75} />
            Alterar responsável
          </button>
        )}
      </div>
    </aside>
  );
}
