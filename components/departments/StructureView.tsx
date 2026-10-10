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
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { DepartmentNode } from './types';

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
      <button
        type="button"
        onClick={() => onPreview(node.id)}
        className={`flex w-full items-center gap-3 rounded-card border p-3 text-left transition-colors ${
          selectedId === node.id
            ? 'border-primary bg-primary-subtle'
            : 'border-border bg-surface hover:border-primary/50'
        }`}
        style={{ marginLeft: node.level * 24, marginBottom: 4 }}
      >
        {hasChildren ? (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-ink-faint hover:text-ink"
          >
            {expanded ? (
              <ChevronDown size={14} strokeWidth={1.75} />
            ) : (
              <ChevronRight size={14} strokeWidth={1.75} />
            )}
          </span>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">{node.name}</span>
            <span className="font-mono text-xs text-ink-faint">{node.code}</span>
            {parentName && (
              <span className="text-xs text-ink-faint">· sob {parentName}</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-ink-faint">
            {node.unit && <span>{node.unit.name}</span>}
            {node.location && <span>{node.location}</span>}
            {node.head && (
              <span className="flex items-center gap-1">
                <Avatar name={node.head.fullName} size="sm" />
                {node.head.fullName}
              </span>
            )}
            <span>{node._count.users} colaboradores</span>
            <span>{node.positionsCount} cargos</span>
            <span>Nível {node.level + 1}</span>
          </div>
        </div>
      </button>

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
          className="mt-4 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#078BFF] to-[#1247D8] text-base font-semibold text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0756D9] sm:h-20 sm:text-lg"
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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViz('tree')}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              viz === 'tree'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            <Network size={14} strokeWidth={1.75} />
            Árvore organizacional
          </button>
          <button
            type="button"
            onClick={() => setViz('list')}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              viz === 'list'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            <List size={14} strokeWidth={1.75} />
            Lista hierárquica
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${previewNode ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        <div>
          {tree.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink-faint">
              Sem departamentos na hierarquia
            </div>
          ) : viz === 'tree' ? (
            <div className="rounded-card border border-border bg-surface p-4">
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
            <Table>
              <TableHead className="bg-[#0F1F3D]/60 [&_th]:text-white">
                <TableRow>
                  <TableHeaderCell>Nível</TableHeaderCell>
                  <TableHeaderCell>Departamento</TableHeaderCell>
                  <TableHeaderCell>Departamento superior</TableHeaderCell>
                  <TableHeaderCell>Unidade</TableHeaderCell>
                  <TableHeaderCell>Localização</TableHeaderCell>
                  <TableHeaderCell>Responsável</TableHeaderCell>
                  <TableHeaderCell>Colaboradores</TableHeaderCell>
                  <TableHeaderCell>Cargos</TableHeaderCell>
                  <TableHeaderCell>Subdeptos</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flatRows.map(({ node, parentName }) => (
                  <TableRow
                    key={node.id}
                    className="cursor-pointer"
                    onClick={() => setPreviewId(node.id)}
                  >
                    <TableCell>
                      <Badge intent="neutral">{node.level + 1}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-ink">{node.name}</span>
                      <span className="ml-1.5 font-mono text-xs text-ink-faint">
                        {node.code}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {parentName ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node.unit?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node.location ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node.head?.fullName ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node._count.users}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node.positionsCount}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {node.children.length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
