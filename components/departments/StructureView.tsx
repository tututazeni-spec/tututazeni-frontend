// components/departments/StructureView.tsx
// Separador "Estrutura Organizacional" (docs/modulo_departments.md Ponto 3).
// Aqui mostram-se os campos
// pedidos pela spec (unidade, departamento superior, nível, responsável,
// colaboradores, cargos, localização) numa Árvore organizacional — e um
// painel de pré-visualização ao clicar num
// departamento (sem navegar logo para o detalhe completo).

'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Filter,
  GitBranch,
  GraduationCap,
  Network,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { ADMIN_ROLES } from '@/lib/roles';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DepartmentNode } from './types';
import { departmentIcon } from './departmentIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';

interface StructureViewProps {
  onSelect: (id: number) => void;
}

function countDescendants(node: DepartmentNode): number {
  return node.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

function descendantIds(node: DepartmentNode): number[] {
  return node.children.flatMap((c) => [c.id, ...descendantIds(c)]);
}

function findNode(nodes: DepartmentNode[], id: number): DepartmentNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

/** Arrastar e largar para reorganizar a hierarquia (só ADMIN/RH). */
interface DragApi {
  enabled: boolean;
  dragId: number | null;
  /** Pode `dragId` ser largado em `targetId`? (não em si próprio nem nos descendentes) */
  canDrop: (targetId: number) => boolean;
  onStart: (id: number) => void;
  onEnd: () => void;
  onDrop: (targetId: number) => void;
}

interface DeptCardProps {
  node: DepartmentNode;
  parentName: string | null;
  selected: boolean;
  onPreview: (id: number) => void;
  indent?: number;
  toggle?: ReactNode;
  drag?: DragApi;
}

// Mesma grelha no cabeçalho e nas linhas para as colunas alinharem.
const GRID =
  'grid items-center gap-1.5 grid-cols-[minmax(0,1fr)_56px_56px_16px] sm:grid-cols-[minmax(0,1fr)_72px_72px_16px]';

function DeptCard({
  node,
  parentName,
  selected,
  onPreview,
  indent = 0,
  toggle,
  drag,
}: DeptCardProps) {
  const [over, setOver] = useState(false);
  const droppable = Boolean(
    drag?.enabled && drag.dragId != null && drag.canDrop(node.id),
  );
  const Icon = departmentIcon(node.name, node.children.length > 0);
  const extras = [
    parentName ? `sob ${parentName}` : null,
    `${node._count.users} colaboradores`,
    node.unit?.name,
    node.location,
    node.head?.fullName,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => onPreview(node.id)}
      draggable={drag?.enabled || undefined}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(node.id));
        drag?.onStart(node.id);
      }}
      onDragEnd={() => {
        setOver(false);
        drag?.onEnd();
      }}
      onDragOver={(e) => {
        if (!droppable) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (droppable) drag?.onDrop(node.id);
      }}
      className={`${GRID} relative w-full border-b border-brand-line px-2 py-2 text-left transition-colors hover:bg-brand-soft ${
        selected ? 'bg-brand-soft' : ''
      } ${over ? 'before:absolute before:inset-x-0 before:-top-px before:h-[3px] before:rounded-full before:bg-[#2878E5] before:content-[""]' : ''} ${
        drag?.enabled ? 'cursor-grab active:cursor-grabbing' : ''
      } ${drag?.dragId === node.id ? 'opacity-40' : ''}`}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-[85%] w-[4px] -translate-y-1/2 rounded-full bg-[#2878E5]"
        />
      )}
      <div
        className="flex min-w-0 items-center gap-2"
        style={{ paddingLeft: indent }}
      >
        {toggle}
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-bold text-brand">
            {node.name}
          </div>
          <div className="truncate text-micro text-[#7890AC]">
            {extras.join(' · ')}
          </div>
        </div>
      </div>
      <span className="text-xs font-semibold text-brand">
        {node.positionsCount}
      </span>
      <span className="text-xs font-semibold text-brand">{node.level + 1}</span>
      <ChevronRight
        size={18}
        strokeWidth={1.75}
        className="flex-shrink-0 text-brand"
      />
    </button>
  );
}

interface TreeRowProps {
  node: DepartmentNode;
  forceExpand?: boolean;
  drag?: DragApi;
  parentName: string | null;
  selectedId: number | null;
  onPreview: (id: number) => void;
}

function TreeRow({
  node,
  forceExpand,
  drag,
  parentName,
  selectedId,
  onPreview,
}: TreeRowProps) {
  const [open, setOpen] = useState(node.level < 1);
  const expanded = forceExpand || open;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <DeptCard
        node={node}
        parentName={parentName}
        selected={selectedId === node.id}
        onPreview={onPreview}
        indent={node.level * 24}
        drag={drag}
        toggle={
          hasChildren ? (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-brand-muted hover:text-brand-ink"
            >
              {expanded ? (
                <ChevronDown size={14} strokeWidth={1.75} />
              ) : (
                <ChevronRight size={14} strokeWidth={1.75} />
              )}
            </span>
          ) : (
            <span className="w-5 flex-shrink-0" />
          )
        }
      />

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              forceExpand={forceExpand}
              drag={drag}
              parentName={node.name}
              selectedId={selectedId}
              onPreview={onPreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeaderIllustration() {
  return (
    <svg
      viewBox="0 0 160 130"
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="dept-book-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3FA2FF" />
          <stop offset="1" stopColor="#0756D9" />
        </linearGradient>
        <linearGradient id="dept-cap-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5BB4FF" />
          <stop offset="1" stopColor="#0A63E8" />
        </linearGradient>
      </defs>
      {/* livros */}
      <rect x="22" y="96" width="116" height="20" rx="4" fill="#0A3C9E" />
      <rect
        x="22"
        y="96"
        width="116"
        height="6"
        rx="3"
        fill="#EAF3FF"
        opacity="0.85"
      />
      <rect
        x="32"
        y="74"
        width="96"
        height="20"
        rx="4"
        fill="url(#dept-book-a)"
      />
      <rect
        x="32"
        y="74"
        width="96"
        height="6"
        rx="3"
        fill="#EAF3FF"
        opacity="0.85"
      />
      <rect x="42" y="54" width="76" height="18" rx="4" fill="#0756D9" />
      <rect
        x="42"
        y="54"
        width="76"
        height="5"
        rx="2.5"
        fill="#EAF3FF"
        opacity="0.85"
      />
      {/* capelo */}
      <path d="M52 34v14c0 7 12 12 28 12s28-5 28-12V34z" fill="#0756D9" />
      <path d="M80 8 20 30l60 22 60-22z" fill="url(#dept-cap-a)" />
      <path d="M80 8 20 30l60 22V8z" fill="#fff" opacity="0.12" />
      <path
        d="M130 33v24"
        stroke="#EAF3FF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="130" cy="60" r="4" fill="#078BFF" />
    </svg>
  );
}

const PREVIEW_FIELD_ICON = 'h-[18px] w-[18px]';

interface PreviewFieldProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}

function PreviewField({ icon: Icon, label, children }: PreviewFieldProps) {
  return (
    <div className="flex items-center gap-3 border-b border-brand-line py-3 last:border-b-0">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-card bg-brand-soft text-brand">
        <Icon className={PREVIEW_FIELD_ICON} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-[#7186A8]">
          {label}
        </dt>
        <dd className="mt-0.5 break-words text-base font-semibold text-brand">
          {children}
        </dd>
      </div>
    </div>
  );
}

interface PreviewPanelProps {
  node: DepartmentNode;
  onViewDetail: (id: number) => void;
  onClose: () => void;
}

function PreviewPanel({ node, onViewDetail, onClose }: PreviewPanelProps) {
  const descendants = countDescendants(node);
  return (
    <aside
      aria-label={`Resumo de ${node.name}`}
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
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#078BFF] text-white">
            <GraduationCap size={24} strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <div className="break-words text-xl font-bold leading-tight text-white">
              {node.name}
            </div>
            <div className="mt-0.5 font-mono text-sm tracking-wider text-[#BFDBFF]">
              {node.code}
            </div>
          </div>
        </div>
        <div className="absolute -bottom-2 right-2 h-28 w-36 sm:h-32 sm:w-40">
          <HeaderIllustration />
        </div>
      </div>

      <div className="relative -mt-5 rounded-t-[24px] bg-surface px-5 pb-5 pt-2">
        <dl>
          <PreviewField icon={User} label="Responsável">
            {node.head ? (
              <span className="flex items-center gap-2">
                <Avatar name={node.head.fullName} size="sm" />
                {node.head.fullName}
              </span>
            ) : (
              '—'
            )}
          </PreviewField>
          <PreviewField icon={Users} label="Colaboradores">
            {node._count.users}
          </PreviewField>
          <PreviewField icon={Network} label="Subdepartamentos">
            {node.children.length === 0
              ? 'Nenhum'
              : node.children.map((c) => c.name).join(', ')}
          </PreviewField>
          <PreviewField icon={Briefcase} label="Cargos">
            {node.positionsCount}
          </PreviewField>
          <PreviewField icon={GitBranch} label="Estrutura descendente">
            {descendants === 0
              ? 'Sem sub-estrutura'
              : `${descendants} departamento(s) abaixo`}
          </PreviewField>
        </dl>

        <button
          type="button"
          onClick={() => onViewDetail(node.id)}
          className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-panel bg-brand text-base font-semibold text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:h-20 sm:text-lg"
        >
          Ver detalhe completo
          <ArrowRight size={20} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

function normalize(t: string): string {
  return t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

// Mantém os departamentos que cumprem os filtros e os seus antepassados.
function filterTree(
  nodes: DepartmentNode[],
  q: string,
  active: string,
): DepartmentNode[] {
  return nodes.flatMap((n) => {
    const children = filterTree(n.children, q, active);
    const matches =
      (!q ||
        normalize(`${n.name} ${n.code} ${n.head?.fullName ?? ''}`).includes(
          q,
        )) &&
      (!active || String(n.active) === active);
    return matches || children.length > 0 ? [{ ...n, children }] : [];
  });
}

export function StructureView({ onSelect }: StructureViewProps) {
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [dragId, setDragId] = useState<number | null>(null);
  const canManage = useHasRole(ADMIN_ROLES);
  const notify = useToast();
  const confirm = useConfirm();

  const {
    data: tree = [],
    isLoading: loading,
    error: queryError,
  } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const moveMutation = useApiMutation(
    (v: { id: number; beforeId: number }) =>
      apiClient.post(`/departments/${v.id}/move-before`, {
        beforeId: v.beforeId,
      }),
    {
      invalidateKeys: [queryKeys.departments.all],
      onSuccess: () =>
        notify({ title: 'Hierarquia actualizada', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Não foi possível mover o departamento',
          description: e.message,
          intent: 'danger',
        }),
    },
  );
  // Pede confirmação antes de efectivar a mudança de posição.
  const moveBefore = async (id: number, beforeId: number) => {
    const moved = findNode(tree, id);
    const target = findNode(tree, beforeId);
    if (!moved || !target || moveMutation.isPending) return;
    const ok = await confirm({
      title: 'Alterar a posição na hierarquia?',
      message: `«${moved.name}» passa a ficar acima de «${target.name}»${
        moved.parentId !== target.parentId
          ? ' e muda para o mesmo nível dele'
          : ''
      }.`,
      confirmLabel: 'Confirmar',
    });
    if (ok) moveMutation.mutate({ id, beforeId });
  };
  const dragNode = dragId != null ? findNode(tree, dragId) : null;
  const blocked = new Set<number>(
    dragNode ? [dragNode.id, ...descendantIds(dragNode)] : [],
  );
  const drag: DragApi = {
    enabled: canManage,
    dragId,
    canDrop: (targetId) => !blocked.has(targetId),
    onStart: setDragId,
    onEnd: () => setDragId(null),
    onDrop: (targetId) => {
      const moving = dragId;
      setDragId(null);
      if (moving != null) void moveBefore(moving, targetId);
    },
  };
  const q = normalize(search);
  const visibleTree = useMemo(
    () => filterTree(tree, q, activeFilter),
    [tree, q, activeFilter],
  );
  const previewNode = previewId != null ? findNode(tree, previewId) : null;

  if (loading)
    return (
      <Skeleton
        rows={8}
        wrapperClassName="space-y-2"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );
  if (queryError)
    return <div className="text-sm text-danger">{queryError.message}</div>;

  return (
    <div>
      <div
        className={`grid gap-4 ${previewNode ? 'lg:grid-cols-[1fr_380px]' : ''}`}
      >
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <SearchInput
                variant="underline"
                placeholder="Pesquisar por nome, código ou gestor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="min-w-[180px]">
              <Select
                variant="underline"
                icon={Filter}
                items={STATUS_ITEMS}
                value={activeFilter || 'ALL'}
                onValueChange={(v) => setActiveFilter(v === 'ALL' ? '' : v)}
              />
            </div>
          </div>
          <div
            className={`${GRID} rounded-[10px] bg-[#DCE8FA] px-2 py-2 text-[11px] font-bold uppercase text-brand`}
          >
            <span>Departamentos</span>
            <span>Cargos</span>
            <span>Níveis</span>
            <span />
          </div>
          {canManage && (
            <div className="mt-2 px-1 text-micro text-[#7890AC]">
              Arraste um departamento para cima de outro para o colocar antes
              dele na hierarquia.
            </div>
          )}
          {visibleTree.length === 0 ? (
            <EmptyState
              variant="inline"
              title="Sem departamentos na hierarquia"
            />
          ) : (
            <div>
              {visibleTree.map((node) => (
                <TreeRow
                  key={node.id}
                  node={node}
                  forceExpand={Boolean(q || activeFilter)}
                  drag={drag}
                  parentName={null}
                  selectedId={previewId}
                  onPreview={setPreviewId}
                />
              ))}
            </div>
          )}
        </div>

        {previewNode && (
          <PreviewPanel
            node={previewNode}
            onViewDetail={onSelect}
            onClose={() => setPreviewId(null)}
          />
        )}
      </div>
    </div>
  );
}
