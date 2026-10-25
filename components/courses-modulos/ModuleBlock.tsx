// components/courses-modulos/ModuleBlock.tsx
// Cartão de um módulo com as suas lições dentro, no desenho do cartão de
// Categorias (CategoryCard): cartão branco de cantos largos, painel
// recortado na diagonal com o gradiente da paleta (por id), ícone redondo +
// título a azul-marinho, pílulas de estado, linhas de informação com ícone e
// rodapé com as acções. As lições ficam no mesmo cartão, entre as informações
// e o rodapé, e recolhem-se pela linha "N lições".

'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Clock,
  ListChecks,
  Package,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import {
  CATEGORY_BTN_GHOST,
  CATEGORY_BTN_PRIMARY,
} from '@/components/courses/CategoryCard';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { useHasRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import type { CourseModule, Lesson, ModuleStatus } from './types';
import { LessonRow } from './LessonRow';

const STATUS_PILL: Record<ModuleStatus, { label: string; cls: string }> = {
  PUBLISHED: { label: 'Publicado', cls: 'bg-[#2B7FE8] text-white' },
  DRAFT: { label: 'Rascunho', cls: 'bg-brand-line text-[#4B5E80]' },
  PAUSED: { label: 'Em pausa', cls: 'bg-[#F5E6C8] text-[#8A5A10]' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-brand-line text-[#4B5E80]' },
};

const TYPE_LABEL: Record<string, string> = {
  THEORETICAL: 'Teórico',
  PRACTICAL: 'Prático',
  ASSESSMENT: 'Avaliação',
  PROJECT: 'Projecto',
};

function InfoLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-[#4B5E80]" />
      <span className="text-sm font-medium text-brand">{text}</span>
    </div>
  );
}

interface ModuleBlockProps {
  mod: CourseModule;
  onEditModule: () => void;
  onDeleteModule: () => void;
  onAddLesson: () => void;
  onEditLesson: (l: Lesson) => void;
  onDeleteLesson: (l: Lesson) => void;
}

export function ModuleBlock({
  mod,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: ModuleBlockProps) {
  // ADMIN/RH apenas — módulos/lições são @Roles(ADMIN, RH) no backend.
  const canManage = useHasRole(ADMIN_ROLES);
  const [open, setOpen] = useState(true);
  const palette = PALETTE[Math.abs(mod.id) % PALETTE.length];
  const status = STATUS_PILL[mod.status ?? 'PUBLISHED'];
  const lessonCount = mod.lessons.length;
  const typeLabel = mod.type ? TYPE_LABEL[mod.type] : null;

  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-panel border border-brand-line bg-white p-4 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
      {/* Painel recortado na diagonal (canto superior direito) */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 hidden h-36 w-[30%] items-center justify-center sm:flex"
        style={{
          background: `linear-gradient(150deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`,
          clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 0 78%)',
        }}
      >
        <Package size={36} strokeWidth={1.25} className="ml-5 text-white/80" />
      </div>

      <div className="relative flex items-center gap-3 sm:max-w-[68%]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0E6B4E] text-white">
          <Package size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="break-words font-body text-xl font-extrabold leading-tight text-brand">
            {mod.title}
          </h3>
          {mod.description && (
            <p className="line-clamp-1 text-sm text-[#5B6B88]">
              {mod.description}
            </p>
          )}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 sm:max-w-[68%]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6366F1] px-3 py-1 text-xs font-semibold text-white">
          <Package size={12} strokeWidth={2} />
          Módulo {mod.seq}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}
        >
          {status.label}
        </span>
        {typeLabel && <InfoLine icon={ListChecks} text={typeLabel} />}
        {mod.estimatedDurationMinutes ? (
          <InfoLine icon={Clock} text={`${mod.estimatedDurationMinutes} min`} />
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title={open ? 'Recolher lições' : 'Mostrar lições'}
          className="flex items-center gap-2 rounded-control text-left hover:underline"
        >
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className={`shrink-0 text-[#4B5E80] transition-transform ${open ? '' : '-rotate-90'}`}
          />
          <span className="text-sm font-medium text-brand">
            {lessonCount} {lessonCount === 1 ? 'lição' : 'lições'}
          </span>
        </button>
      </div>

      {open && (
        <div className="relative flex flex-col gap-2">
          {lessonCount === 0 ? (
            <p className="m-0 rounded-panel border border-dashed border-[#D5DCE8] py-4 text-center text-sm text-[#5B6B88]">
              {canManage
                ? 'Este módulo ainda não tem lições. Use “Lição” para adicionar a primeira.'
                : 'Este módulo ainda não tem lições.'}
            </p>
          ) : (
            mod.lessons.map((l) => (
              <LessonRow
                key={l.id}
                lesson={l}
                onEdit={() => onEditLesson(l)}
                onDelete={() => onDeleteLesson(l)}
              />
            ))
          )}
        </div>
      )}

      {canManage && (
        <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-brand-line pt-3">
          <button
            type="button"
            onClick={onDeleteModule}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-control border border-[#F0C9CF] bg-white px-3 text-sm font-semibold text-[#B02D45] hover:bg-[#FDF2F4]"
          >
            <Trash2 size={14} strokeWidth={1.75} /> Eliminar
          </button>
          <button
            type="button"
            onClick={onEditModule}
            className={CATEGORY_BTN_GHOST}
          >
            <Pencil size={14} strokeWidth={1.75} /> Editar
          </button>
          <button
            type="button"
            onClick={onAddLesson}
            className={CATEGORY_BTN_PRIMARY}
          >
            <Plus size={14} strokeWidth={2} /> Lição
          </button>
        </div>
      )}
    </div>
  );
}
