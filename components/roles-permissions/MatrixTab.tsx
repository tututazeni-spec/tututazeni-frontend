// components/roles-permissions/MatrixTab.tsx
// Tab "Matriz": tabela role × permissão filtrável por subject.
// Extraído de app/(platform)/roles-permissions/page.tsx.

'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { MatrixData, MatrixPermission } from './types';

// Rótulos PT para os subjects/recursos servidos pela API (todos em
// maiúsculas). Fallback para o token original se não houver tradução.
const RESOURCE_LABELS: Record<string, string> = {
  DASHBOARD: 'Painel',
  REPORTS: 'Relatórios',
  USERS: 'Utilizadores',
  LMS: 'Formação (LMS)',
  PERFORMANCE: 'Desempenho',
  ENGAGEMENT: 'Envolvimento',
  TALENT: 'Talento',
  EVALUATION: 'Avaliação',
  CONTENT_LIBRARY: 'Biblioteca de Conteúdos',
  AVATAR_TRAINING: 'Treino com Avatar',
  ROI_IMPACT: 'Impacto / ROI',
  HISTORY: 'Histórico',
  PAYROLL: 'Folha de Pagamento',
  SENSITIVE_DATA: 'Dados Sensíveis',
  ACL: 'Controlo de Acessos (ACL)',
};

// Rótulos PT para as acções. Fallback para o token original.
const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criar',
  READ: 'Ver',
  VIEW: 'Ver',
  LIST: 'Listar',
  UPDATE: 'Editar',
  EDIT: 'Editar',
  DELETE: 'Eliminar',
  REMOVE: 'Eliminar',
  MANAGE: 'Gerir',
  EXPORT: 'Exportar',
  IMPORT: 'Importar',
  APPROVE: 'Aprovar',
  REJECT: 'Rejeitar',
  ASSIGN: 'Atribuir',
  UNASSIGN: 'Remover atribuição',
  DOWNLOAD: 'Descarregar',
  UPLOAD: 'Carregar',
  SUBMIT: 'Submeter',
  REVIEW: 'Rever',
  ALL: 'Tudo',
};

const translateResource = (s: string): string =>
  RESOURCE_LABELS[(s ?? '').toUpperCase()] ?? s;

const translateAction = (a: string): string =>
  ACTION_LABELS[(a ?? '').toUpperCase()] ?? a;

// O `name` das permissões vem da API em formatos inconsistentes
// ("READ_USERS", "courses:read", ...); compomos o rótulo a partir de
// `action` + `subject`, que são fiáveis e sempre em maiúsculas.
const translatePermName = (p: MatrixPermission): string =>
  `${translateAction(p.action)} · ${translateResource(p.subject)}`;

export function MatrixTab() {
  const [subject, setSubject] = useState('');
  const {
    data,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useApiQuery<MatrixData>(
    queryKeys.rolesPermissions.matrix(),
    '/roles-permissions/matrix',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading)
    return (
      <Skeleton
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  // Sem este ramo, uma falha do GET /matrix deixava só o cabeçalho da tabela
  // e nenhuma linha — indistinguível de "matriz vazia".
  if (isError)
    return <QueryError error={error} onRetry={() => void refetch()} />;

  const subjects = (data?.grouped ?? []).map((g) => g.subject);
  const filtered = subject
    ? (data?.permissions ?? []).filter((p) => p.subject === subject)
    : (data?.permissions ?? []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          intent={!subject ? 'primary' : 'secondary'}
          onClick={() => setSubject('')}
        >
          Todos
        </Button>
        {subjects.map((s: string) => (
          <Button
            key={s}
            size="sm"
            intent={subject === s ? 'primary' : 'secondary'}
            onClick={() => setSubject(s)}
          >
            {translateResource(s)}
          </Button>
        ))}
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Permissão</TableHeaderCell>
            {(data?.roles ?? []).map((r) => (
              <TableHeaderCell
                key={r.id}
                className="text-center whitespace-nowrap"
              >
                {r.name}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((p, i) => (
            <TableRow key={i}>
              <TableCell>
                <p className="font-data text-ink">{translatePermName(p)}</p>
                <p className="text-[10px] text-ink-faint">
                  {translateResource(p.subject)} · {translateAction(p.action)}
                </p>
              </TableCell>
              {(data?.roles ?? []).map((r) => (
                <TableCell key={r.id} className="text-center">
                  {data?.matrix?.[i]?.[r.name] ? (
                    <CheckCircle
                      size={14}
                      strokeWidth={1.75}
                      className="text-success mx-auto"
                    />
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
