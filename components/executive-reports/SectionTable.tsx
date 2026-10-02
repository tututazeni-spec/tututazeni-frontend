// components/executive-reports/SectionTable.tsx
// Apresenta as secções (tabelas normalizadas) de um relatório gerado ou
// pré-visualizado, com o aviso das secções omitidas por permissões.

import { Card } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { OmittedSection, ReportSection } from './reportTypes';

export interface SectionTablesProps {
  sections: ReportSection[];
  omitted?: OmittedSection[];
}

export function SectionTables({ sections, omitted = [] }: SectionTablesProps) {
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <Card key={s.key} className="p-4">
          <div className="mb-1 font-body text-sm font-semibold text-ink">
            {s.title}
          </div>
          <div className="mb-3 font-body text-xs text-ink-faint">
            Origem: {s.sourceModules.join(', ') || '—'}
          </div>
          {s.rows.length === 0 ? (
            <p className="font-body text-sm text-ink-muted">
              {s.note ?? 'Sem dados'}
            </p>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    {s.columns.map((c) => (
                      <TableHeaderCell key={c.key}>{c.label}</TableHeaderCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {s.rows.map((r, i) => (
                    <TableRow key={i}>
                      {s.columns.map((c) => (
                        <TableCell key={c.key}>{r[c.key] ?? ''}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {s.note && (
                <p className="mt-2 font-body text-xs text-ink-muted">
                  {s.note}
                </p>
              )}
            </>
          )}
        </Card>
      ))}
      {omitted.length > 0 && (
        <p className="font-body text-xs text-ink-muted">
          Secções omitidas:{' '}
          {omitted.map((o) => `${o.key} (${o.reason})`).join('; ')}
        </p>
      )}
    </div>
  );
}
