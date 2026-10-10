// components/departments/StructureView.tsx
// Separador "Estrutura Organizacional" (docs/modulo_departments.md Ponto 3).
// Distinto do separador "Organograma" (TreeView): aqui mostram-se os campos
// pedidos pela spec (unidade, departamento superior, nível, responsável,
// colaboradores, cargos, localização) com duas visualizações — Árvore e
// Lista hierárquica — e um painel de pré-visualização ao clicar num
// departamento (sem navegar logo para o detalhe completo).

'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Briefcase,
  ChevronDown,
  ChevronRight,
  GitBranch,
  GraduationCap,
  List,
  Network,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { DepartmentNode } from './types';
import { departmentIcon } from './departmentIcon';

interface StructureViewProps {
  onSelect: (id: number) => void;
}

type VizMode = 'tree' | 'list';

interface FlatRow {
  node: DepartmentNode;
  parentName: string | null;
}

function flatten(nodes: DepartmentNode[], parentName: string | null = null): FlatRow[] {
  return nodes.flatMap((n) => [
    { node: n, parentName },
    ...flatten(n.children, n.name),
  ]);
}

function countDescendants(node: DepartmentNode): number {
  return node.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

function findNode(nodes: DepartmentNode[], id: number): DepartmentNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

function DeptCard({
  node,
  parentName,
  selected,
  onPreview,
  indent = 0,
  toggle,
}: {
  node: DepartmentNode;
  parentName: string | null;
  selected: boolean;
  onPreview: (id: number) => void;
  indent?: number;
  toggle?: ReactNode;
}) {
  const Icon = departmentIcon(node.name, node.children.length > 0);
  const stats = [
    `${node._count.users} Colaboradores`,
    `${node.positionsCount} Cargos`,
    `Nível ${node.level + 1}`,
  ];
  const extras = [node.unit?.name, node.location, node.head?.fullName].filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => onPreview(node.id)}
      style={{ marginLeft: indent, width: `calc(100% - ${indent}px)` }}
      className={`relative mb-1.5 flex items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors ${
        selected
          ? 'border-[#C9DDF8] bg-[#E5F0FF]'
          : 'border-[#E1EAF6] bg-[#F0F6FF] hover:bg-[#E8F1FF]'
      }`}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-[85%] w-[5px] -translate-y-1/2 rounded-full bg-[#2878E5]"
        />
      )}
      {toggle}
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0F1F3D] text-white">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-bold text-[#0F1F3D]">
            {node.name}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center text-[11px] text-[#61758F]">
          {stats.map((t, i) => (
            <span key={t} className="flex items-center">
              {i > 0 && <span className="mx-[calc(0.5rem+0.5cm)] h-3 w-px bg-[#C7D6E8]" aria-hidden="true" />}
              {t}
            </span>
          ))}
        </div>
        {(parentName || extras.length > 0) && (
          <div className="mt-0.5 truncate text-[11px] text-[#7890AC]">
            {[parentName ? `sob ${parentName}` : null, ...extras].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
      <ChevronRight
        size={18}
        strokeWidth={1.75}
        className={`flex-shrink-0 ${selected ? 'text-[#1765C1]' : 'text-[#526B89]'}`}
      />
    </button>
  );
}

function TreeRow({
  node,
  parentName,
  selectedId,
  onPreview,
}: {
  node: DepartmentNode;
  parentName: string | null;
  selectedId: number | null;
  onPreview: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(node.level < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <DeptCard
        node={node}
        parentName={parentName}
        selected={selectedId === node.id}
        onPreview={onPreview}
        indent={node.level * 24}
        toggle={
          hasChildren ? (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-[#526B89] hover:text-[#17365D]"
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
      <rect x="22" y="96" width="116" height="6" rx="3" fill="#EAF3FF" opacity="0.85" />
      <rect x="32" y="74" width="96" height="20" rx="4" fill="url(#dept-book-a)" />
      <rect x="32" y="74" width="96" height="6" rx="3" fill="#EAF3FF" opacity="0.85" />
      <rect x="42" y="54" width="76" height="18" rx="4" fill="#0756D9" />
      <rect x="42" y="54" width="76" height="5" rx="2.5" fill="#EAF3FF" opacity="0.85" />
      {/* capelo */}
      <path d="M52 34v14c0 7 12 12 28 12s28-5 28-12V34z" fill="#0756D9" />
      <path d="M80 8 20 30l60 22 60-22z" fill="url(#dept-cap-a)" />
      <path d="M80 8 20 30l60 22V8z" fill="#fff" opacity="0.12" />
      <path d="M130 33v24" stroke="#EAF3FF" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="130" cy="60" r="4" fill="#078BFF" />
    </svg>
  );
}

const PREVIEW_FIELD_ICON = 'h-[18px] w-[18px]';

function PreviewField({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#EAF3FF] py-3 last:border-b-0">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#0F1F3D]">
        <Icon className={PREVIEW_FIELD_ICON} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-[#7186A8]">
          {label}
        </dt>
        <dd className="mt-0.5 break-words text-base font-semibold text-[#0F1F3D]">
          {children}
        </dd>
      </div>
    </div>
  );
}

function PreviewPanel({
  node,
  onViewDetail,
  onClose,
}: {
  node: DepartmentNode;
  onViewDetail: (id: number) => void;
  onClose: () => void;
}) {
  const descendants = countDescendants(node);
  return (
    <aside
      aria-label={`Resumo de ${node.name}`}
      className="sticky top-4 self-start overflow-hidden rounded-[24px] border border-[#D6E6FB] bg-[#EAF3FF] shadow-[0_8px_24px_rgba(15,31,61,0.10)]"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#0F1F3D] to-[#0756D9] px-5 pt-5 sm:h-52">
        <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#078BFF]/20" />
        <span className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rotate-45 rounded-3xl bg-white/5" />
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

      <div className="relative -mt-5 rounded-t-[24px] bg-white px-5 pb-5 pt-2">
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
          className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#0F1F3D] text-base font-semibold text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F1F3D] sm:h-20 sm:text-lg"
        >
          Ver detalhe completo
          <ArrowRight size={20} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}

export function StructureView({ onSelect }: StructureViewProps) {
  const [viz, setViz] = useState<VizMode>('tree');
  const [previewId, setPreviewId] = useState<number | null>(null);

  const {
    data: tree = [],
    isLoading: loading,
    error: queryError,
  } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const flatRows = useMemo(() => flatten(tree), [tree]);
  const previewNode = previewId != null ? findNode(tree, previewId) : null;

  if (loading)
    return (
      <Skeleton
        rows={8}
        wrapperClassName="space-y-2 animate-pulse"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );
  if (queryError) return <div className="text-sm text-danger">{queryError.message}</div>;

  return (
    <div>
      <div className="mb-4 flex h-10 items-center gap-2 rounded-t-2xl bg-[#0F1F3D]/60 px-4">
        {(
          [
            ['tree', Network, 'Árvore organizacional'],
            ['list', List, 'Lista hierárquica'],
          ] as const
        ).map(([mode, Icon, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViz(mode)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium uppercase text-white transition-colors ${
              viz === mode ? 'bg-[#0F1F3D]' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <Icon size={14} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${previewNode ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        <div>
          {tree.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink-faint">
              Sem departamentos na hierarquia
            </div>
          ) : viz === 'tree' ? (
            <div>
              {tree.map((node) => (
                <TreeRow
                  key={node.id}
                  node={node}
                  parentName={null}
                  selectedId={previewId}
                  onPreview={setPreviewId}
                />
              ))}
            </div>
          ) : (
            <div>
              {flatRows.map(({ node, parentName }) => (
                <DeptCard
                  key={node.id}
                  node={node}
                  parentName={parentName}
                  selected={previewId === node.id}
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
