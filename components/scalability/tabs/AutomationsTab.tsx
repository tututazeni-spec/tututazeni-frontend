'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';
import { queryKeys } from '@/lib/queryKeys';
import { CreateRuleModal } from '@/components/automation/CreateRuleModal';
import type { AutomationRule } from '../types';
import { SectionHeader, timeAgo } from './shared';

interface AutomationsTabProps {
  rules: AutomationRule[];
  onExecute: (id: number) => void;
}

export function AutomationsTab({ rules, onExecute }: AutomationsTabProps) {
  const [creatingRule, setCreatingRule] = useState(false);
  const triggerLabel: Record<string, string> = {
    USER_HIRED: 'Contratação',
    USER_PROMOTED: 'Promoção',
    USER_TRANSFERRED: 'Transferência',
    USER_OFFBOARDED: 'Saída',
    COURSE_COMPLETED: 'Conclusão Curso',
    CERTIFICATE_EXPIRED: 'Certificado Expirado',
    TRAIL_COMPLETED: 'Trilha Concluída',
    SCHEDULED_CRON: 'Agendado',
    WEBHOOK_EVENT: 'Webhook',
    MANUAL: 'Manual',
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeader title="Regras de Automação" />
        <Button
          intent="secondary"
          size="sm"
          onClick={() => setCreatingRule(true)}
        >
          Nova Regra
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {rules.map((rule) => {
          const status = !rule.isActive
            ? { label: 'Inactiva', cls: 'text-ink-faint' }
            : rule.lastRunStatus === 'FAILED'
              ? { label: 'Última falhou', cls: 'text-danger' }
              : { label: 'OK', cls: 'text-success' };
          return (
            <Card
              key={rule.id}
              className="overflow-hidden rounded-[24px] border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]"
            >
              <CardBody className="flex flex-wrap items-center gap-4 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'font-body text-[15px] font-semibold',
                      rule.isActive ? 'text-brand' : 'text-brand-muted',
                    )}
                  >
                    {rule.name}
                  </p>
                  <p className="font-body text-xs text-brand-muted">
                    Gatilho:{' '}
                    {triggerLabel[rule.triggerType] ?? rule.triggerType}
                    {' · '}
                    {rule.runCount.toLocaleString()} execuções
                    {rule.lastRunAt && ` · ${timeAgo(rule.lastRunAt)}`}
                  </p>
                </div>
                <span
                  className={cn('font-body text-xs font-semibold', status.cls)}
                >
                  {status.label}
                </span>
                <Button
                  intent="secondary"
                  size="sm"
                  disabled={!rule.isActive}
                  onClick={() => onExecute(rule.id)}
                >
                  Executar
                </Button>
              </CardBody>
            </Card>
          );
        })}
        {rules.length === 0 && (
          <EmptyState
            title="Sem regras de automação"
            description="Cria uma regra para automatizar acções em resposta a eventos da plataforma."
          />
        )}
      </div>

      {creatingRule && (
        <CreateRuleModal
          onClose={() => setCreatingRule(false)}
          extraInvalidateKeys={[
            queryKeys.scalability.automations(),
            queryKeys.scalability.dashboard(),
          ]}
        />
      )}
    </div>
  );
}
