// components/avatar-training/AvatarCard.tsx
// Cartão da aba "Avatares" no desenho do CategoryCard (aba Categorias do
// módulo Cursos): cartão branco, pílulas no topo, ícone redondo + título a
// azul-marinho, linhas de informação com ícone, painel recortado na diagonal à
// direita e rodapé com botões. Diferença: o painel é a imagem do avatar e vai
// do extremo superior ao extremo inferior do cartão.

import type { ReactNode } from 'react';
import {
  Bot,
  Building2,
  CalendarDays,
  Globe,
  Library,
  MessageCircle,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import {
  CATEGORY_BTN_GHOST,
  CATEGORY_BTN_PRIMARY,
} from '@/components/courses/CategoryCard';
import { formatDate } from '@/lib/format';
import { AVATAR_STATUS, AVATAR_TYPE_LABEL } from './constants';
import type { TrainingAvatar } from './types';

export const AVATAR_BTN_PRIMARY = CATEGORY_BTN_PRIMARY;
export const AVATAR_BTN_GHOST = CATEGORY_BTN_GHOST;

function InfoLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-[#4B5E80]" />
      <span className="text-sm font-medium text-[#0F1F3D]">{text}</span>
    </div>
  );
}

const STATUS_PILL: Record<string, string> = {
  ACTIVE: 'bg-[#2B7FE8] text-white',
  TESTING: 'bg-[#F5A524] text-white',
  INACTIVE: 'bg-[#E4E9F2] text-[#4B5E80]',
  ARCHIVED: 'bg-[#E4E9F2] text-[#4B5E80]',
};

export function AvatarCard({
  avatar: a,
  showAdminInfo,
  actions,
}: {
  avatar: TrainingAvatar;
  /** Fornecedor, responsável, fontes e teste só para quem gere avatares. */
  showAdminInfo: boolean;
  actions?: ReactNode;
}) {
  const palette = PALETTE[Math.abs(a.id) % PALETTE.length];
  const language = `${a.language}${a.languageVariant ? ` (${a.languageVariant})` : ''}`;

  return (
    <div className="relative flex h-full flex-col justify-between gap-3 overflow-hidden rounded-3xl border border-[#E4E9F2] bg-white p-4 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
      {/* Imagem do avatar: de cima a baixo, recortada na diagonal à esquerda */}
      <div
        aria-hidden={!a.imageUrl}
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[30%] items-center justify-center sm:flex"
        style={{
          background: `linear-gradient(150deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`,
          clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 0 100%)',
        }}
      >
        {a.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.imageUrl}
            alt={`Imagem do avatar ${a.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <Bot size={44} strokeWidth={1.25} className="ml-5 text-white/80" />
        )}
      </div>

      <div className="relative flex items-center gap-3 sm:max-w-[68%]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0E6B4E] text-white">
          <Bot size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="break-words font-body text-xl font-extrabold leading-tight text-[#0F1F3D]">
            {a.name}
          </h3>
          {a.description && (
            <p className="line-clamp-1 text-sm text-[#5B6B88]">
              {a.description}
            </p>
          )}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 sm:max-w-[68%]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6366F1] px-3 py-1 text-xs font-semibold text-white">
          <Bot size={12} strokeWidth={2} />
          {AVATAR_TYPE_LABEL[a.avatarType]}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILL[a.status] ?? STATUS_PILL.INACTIVE}`}
        >
          {AVATAR_STATUS[a.status].label}
        </span>
        <InfoLine icon={Globe} text={language} />
        {a.specialty && <InfoLine icon={Sparkles} text={a.specialty} />}
        {a.tone && <InfoLine icon={MessageCircle} text={a.tone} />}
        {showAdminInfo && (
          <>
            <InfoLine
              icon={Building2}
              text={
                a.provider
                  ? `${a.provider}${a.providerModel ? ` ${a.providerModel}` : ''}`
                  : 'Sem fornecedor'
              }
            />
            {a.responsibleName && (
              <InfoLine icon={UserCheck} text={a.responsibleName} />
            )}
            <InfoLine
              icon={Library}
              text={`${a.knowledgeBase?.length ?? 0} fonte(s)`}
            />
            <InfoLine
              icon={CalendarDays}
              text={
                a.lastTestedAt
                  ? `Testado ${formatDate(a.lastTestedAt)}`
                  : 'Por testar'
              }
            />
          </>
        )}
      </div>

      {actions && (
        <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-[#E4E9F2] pt-3 sm:max-w-[68%]">
          {actions}
        </div>
      )}
    </div>
  );
}
