// components/scalability/WhatIfPanel.tsx
// modulo_scalability.md §29 P2 — simulação de crescimento (what-if) na aba Capacidade.
// Auto-contido: chama POST /scalability/what-if; extrapolação linear, só ordem de grandeza.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Header, Note } from './InfraTabs';
import type { InfraLevel } from './types';

interface WhatIfResult {
  users: number;
  concurrentUsers: number;
  verdict: InfraLevel;
  recommendations: string[];
  resources: Array<{
    key: string;
    label: string;
    projected: number | null;
    capacity: number | null;
    percent: number | null;
    level: InfraLevel | null;
  }>;
  note: string;
}

const LEVEL: Record<
  InfraLevel,
  { label: string; intent: 'success' | 'warning' | 'danger' }
> = {
  OK: { label: 'OK', intent: 'success' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
};

const PRESETS = [10000, 20000, 30000];

export function WhatIfPanel() {
  const [users, setUsers] = useState('10000');
  const [percent, setPercent] = useState('');
  const sim = useApiMutation<
    WhatIfResult,
    { users: number; concurrentPercent?: number }
  >((v) => apiClient.post<WhatIfResult>('/scalability/what-if', v));

  const usersN = Number(users);
  const percentN = percent === '' ? undefined : Number(percent);
  const valid =
    Number.isInteger(usersN) &&
    usersN >= 1 &&
    (percentN === undefined || (percentN >= 0.1 && percentN <= 100));
  const r = sim.data;

  return (
    <div className="flex flex-col gap-4">
      <Header
        title="Simulação de crescimento"
        sub="O que acontece se tivermos mais utilizadores? Extrapolação a partir do consumo actual."
      />
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-end gap-4">
            <FormField label="Utilizadores" htmlFor="whatif-users">
              <Input
                id="whatif-users"
                type="number"
                min={1}
                value={users}
                onChange={(e) => setUsers(e.target.value)}
              />
            </FormField>
            <FormField
              label="% em simultâneo"
              htmlFor="whatif-percent"
              hint="Vazio = proporcional ao pico actual"
            >
              <Input
                id="whatif-percent"
                type="number"
                min={0.1}
                max={100}
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
            </FormField>
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  intent="secondary"
                  onClick={() => setUsers(String(p))}
                >
                  {p.toLocaleString('pt-PT')}
                </Button>
              ))}
            </div>
            <Button
              disabled={!valid || sim.isPending}
              onClick={() =>
                sim.mutate({ users: usersN, concurrentPercent: percentN })
              }
            >
              Simular
            </Button>
          </div>
        </CardBody>
      </Card>

      {sim.isError && (
        <Note>Não foi possível simular. Tente novamente.</Note>
      )}

      {r && (
        <Card>
          <CardBody>
            <div className="mb-3 flex items-center gap-3">
              <span className="font-body text-sm text-ink">
                {r.users.toLocaleString('pt-PT')} utilizadores ·{' '}
                {r.concurrentUsers.toLocaleString('pt-PT')} em simultâneo
              </span>
              <Badge intent={LEVEL[r.verdict].intent} dot>
                {LEVEL[r.verdict].label}
              </Badge>
            </div>
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="py-1">Recurso</th>
                  <th className="py-1">Projectado</th>
                  <th className="py-1">Capacidade</th>
                  <th className="py-1">Uso</th>
                </tr>
              </thead>
              <tbody>
                {r.resources.map((x) => (
                  <tr key={x.key}>
                    <td className="py-1">{x.label}</td>
                    <td className="py-1">{x.projected ?? '—'}</td>
                    <td className="py-1">{x.capacity ?? '—'}</td>
                    <td className="py-1">
                      {x.level ? (
                        <Badge intent={LEVEL[x.level].intent} dot>
                          {x.percent}%
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {r.recommendations.length > 0 && (
              <ul className="mt-4 list-disc pl-5 font-body text-sm text-ink">
                {r.recommendations.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Note>{r.note}</Note>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
