// components/ui/DataTable.tsx
// Tabela de dados genérica — envolve os primitivos já existentes (Table,
// Pagination) em vez de reinventar o visual: cada página deixa de andar a
// implementar a sua própria ordenação/paginação à mão sobre <Table>.

'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from './Table';
import { Pagination } from './Pagination';
import { Input } from './Input';
import { EmptyState } from './EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  /** valor usado para ordenar; por omissão lê `row[key]` */
  accessor?: (row: T) => string | number | null | undefined;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  pageSize?: number;
  searchPlaceholder?: string;
  /** chaves de `T` pesquisadas pelo campo de filtro; omitido = sem filtro */
  searchKeys?: (keyof T)[];
  emptyLabel?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  pageSize = 10,
  searchPlaceholder,
  searchKeys,
  emptyLabel = 'Não há registos para mostrar.',
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    null,
  );
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query || !searchKeys?.length) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) =>
        String(row[key] ?? '')
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const getValue =
      col.accessor ??
      ((row: T) =>
        (row as Record<string, unknown>)[col.key] as string | number);
    return [...filtered].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
    setPage(1);
  }

  return (
    <div className={cn('space-y-3', className)}>
      {searchKeys && searchKeys.length > 0 && (
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder ?? 'Pesquisar…'}
          className="w-64"
        />
      )}

      {sorted.length === 0 ? (
        <EmptyState title="Sem resultados" description={emptyLabel} />
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableHeaderCell
                    key={col.key}
                    className={cn(
                      col.sortable && 'cursor-pointer select-none',
                      col.className,
                    )}
                    onClick={
                      col.sortable ? () => toggleSort(col.key) : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable &&
                        (sort?.key === col.key ? (
                          sort.dir === 'asc' ? (
                            <ArrowUp size={12} strokeWidth={2} />
                          ) : (
                            <ArrowDown size={12} strokeWidth={2} />
                          )
                        ) : (
                          <ArrowUpDown
                            size={12}
                            strokeWidth={2}
                            className="text-ink-faint"
                          />
                        ))}
                    </span>
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render
                        ? col.render(row)
                        : String(
                            (row as Record<string, unknown>)[col.key] ?? '—',
                          )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
