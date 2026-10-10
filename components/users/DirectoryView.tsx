// components/users/DirectoryView.tsx
// Vista "Diretório Interno": pesquisa livre de colaboradores.
// Extraído de app/(platform)/users/page.tsx.

'use client';

import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Briefcase, Mail, MoreHorizontal, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DirectoryUser } from './types';

interface DirectoryViewProps {
  onSelect: (id: number) => void;
}

/* ── Cores do badge por departamento ───────────────────────── */
interface BadgeStyle {
  bg: string;
  text: string;
}

const KNOWN_DEPARTMENTS: Record<string, BadgeStyle> = {
  Administração: { bg: '#E3ECFD', text: '#2F55C8' },
  Engenharia: { bg: '#DDF3E8', text: '#2A7D58' },
  'Recursos Humanos': { bg: '#ECE6FB', text: '#5B3FC4' },
};

// Paleta para qualquer outro departamento (cor estável por nome)
const FALLBACK_BADGES: BadgeStyle[] = [
  { bg: '#FDEBDD', text: '#B5561F' },
  { bg: '#DDF0F6', text: '#2B7894' },
  { bg: '#FBE4EA', text: '#B23A59' },
  { bg: '#F5F0D6', text: '#8A7A12' },
];

const AVATAR_COLORS = [
  '#2F55C8',
  '#D9694A',
  '#5B3FC4',
  '#3E86A8',
  '#4E9A74',
  '#C9553F',
  '#7A4FB5',
];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function badgeFor(department: string | undefined): BadgeStyle {
  if (!department) return { bg: '#EEF1F6', text: '#475569' };
  return (
    KNOWN_DEPARTMENTS[department] ??
    FALLBACK_BADGES[hash(department) % FALLBACK_BADGES.length]
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Cartão de colaborador ─────────────────────────────────── */
function DirectoryCard({
  user,
  onSelect,
}: {
  user: DirectoryUser;
  onSelect: (id: number) => void;
}) {
  const departmentName = user.department?.name;
  const badge = badgeFor(departmentName);

  const open = () => onSelect(user.id);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  const handleMenu = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    open();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0F1F3D]"
    >
      {/* Cabeçalho navy */}
      <div
        className="relative h-[60px]"
        style={{
          background:
            'linear-gradient(135deg, #0F1F3D 0%, #1B3366 60%, #25448A 100%)',
        }}
      >
        <button
          type="button"
          onClick={handleMenu}
          aria-label={`Ver perfil de ${user.fullName}`}
          className="absolute right-3 top-2.5 rounded-md p-1 text-white/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {/* Avatar sobreposto */}
        <div className="absolute -bottom-7 left-5">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="h-[60px] w-[60px] rounded-full border-[3px] border-white object-cover shadow"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-[3px] border-white text-lg font-semibold text-white shadow"
              style={{
                backgroundColor:
                  AVATAR_COLORS[hash(user.fullName) % AVATAR_COLORS.length],
              }}
            >
              {initialsOf(user.fullName)}
            </div>
          )}
        </div>
      </div>

      {/* Corpo */}
      <div className="px-5 pb-4 pt-9">
        <h3 className="truncate text-[15px] font-semibold text-[#0F1F3D]">
          {user.fullName}
        </h3>
        <p className="mt-0.5 truncate text-sm text-slate-400">
          {departmentName ?? '—'}
        </p>

        {departmentName && (
          <span
            className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{departmentName}</span>
          </span>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="flex min-w-0 items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 shrink-0 text-[#0F1F3D]" />
            <span className="truncate">{user.email ?? '—'}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-[#0F1F3D]" />
            <span className="max-w-[110px] truncate">
              {user.position?.name ?? '—'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Vista principal ───────────────────────────────────────── */
export function DirectoryView({ onSelect }: DirectoryViewProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data = [], isLoading: loading } = useApiQuery<DirectoryUser[]>(
    queryKeys.users.directory(debouncedSearch),
    '/users/directory',
    {
      params: { search: debouncedSearch },
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );

  return (
    <div>
      <Input
        type="text"
        placeholder="Pesquisar colaborador, cargo, departamento…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-5"
      />
      {loading ? (
        <Skeleton
          rows={8}
          wrapperClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 animate-pulse"
          itemClassName="h-[190px] rounded-2xl bg-surface-sunken"
        />
      ) : data.length === 0 ? (
        <div className="py-12 text-center text-sm text-ink-faint">
          Nenhum colaborador encontrado
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {data.map((user) => (
            <DirectoryCard key={user.id} user={user} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}