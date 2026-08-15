// components/employees/EmployeeDrawer.tsx
// Painel lateral de pré-visualização rápida do colaborador. Extraído do
// JSX inline "Quick Preview Drawer" de app/(platform)/employees/page.tsx —
// era o maior bloco de apresentação ainda dentro da página principal
// (~156 linhas). Migrado para a fundação de design: classes Tailwind
// cruas passam a tokens; Avatar/StatusBadge locais passam aos
// equivalentes de components/ui/; links de acção passam a Button. Mantém-
// se bespoke (não Radix Dialog) — mesmo padrão de
// components/documents/DetailDrawer.tsx (3º caso conhecido, não há
// componente "Drawer" na fundação e não é para inventar um a meio deste
// módulo); comportamento idêntico ao original (fecha por clique no
// backdrop ou no X).

import {
  Briefcase,
  Building2,
  BookOpen,
  Calendar,
  Edit2,
  Eye,
  MapPin,
  Star,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import type {
  ContractType,
  Employee,
  SeniorityLevel,
} from '@/hooks/useEmployees';
import { Avatar } from '@/components/ui/Avatar';
import { buttonVariants, IconButton } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CONTRACT_LABELS, SENIORITY_LABELS, STATUS_MAP } from './constants';

export interface EmployeeDrawerProps {
  employee: Employee;
  onClose: () => void;
}

export function EmployeeDrawer({ employee, onClose }: EmployeeDrawerProps) {
  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-md h-full overflow-y-auto shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar url={employee.avatarUrl} name={employee.name} size="lg" />
              <div>
                <h2 className="text-lg font-bold text-ink">
                  {employee.name}
                </h2>
                <p className="text-sm text-ink-muted">
                  {employee.jobTitle ?? employee.role}
                </p>
                {employee.matricula && (
                  <p className="text-xs font-mono text-ink-faint mt-0.5">
                    {employee.matricula}
                  </p>
                )}
              </div>
            </div>
            <IconButton icon={X} label="Fechar" intent="ghost" onClick={onClose} />
          </div>
        </div>

        <div className="p-6 space-y-5">
          <StatusBadge value={employee.status} map={STATUS_MAP} variant="dot" />

          <div className="space-y-3">
            {[
              {
                icon: Building2,
                label: 'Departamento',
                value: employee.department,
              },
              {
                icon: MapPin,
                label: 'Localidade',
                value: employee.location,
              },
              {
                icon: Briefcase,
                label: 'Contrato',
                value: employee.contractType
                  ? CONTRACT_LABELS[employee.contractType as ContractType]
                  : undefined,
              },
              {
                icon: TrendingUp,
                label: 'Senioridade',
                value: employee.seniority
                  ? SENIORITY_LABELS[employee.seniority as SeniorityLevel]
                  : undefined,
              },
              {
                icon: Calendar,
                label: 'Admissão',
                value: new Date(employee.joinedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }),
              },
              {
                icon: Users,
                label: 'Gestor',
                value: employee.manager?.name,
              },
            ]
              .filter((row) => row.value)
              .map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <row.icon size={16} strokeWidth={1.75} className="text-ink-faint flex-shrink-0" />
                  <span className="text-xs text-ink-muted w-24 flex-shrink-0">
                    {row.label}
                  </span>
                  <span className="text-sm font-medium text-ink flex-1">
                    {row.value}
                  </span>
                </div>
              ))}
          </div>

          {employee._count && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Skills',
                  value: employee._count.employeeSkills,
                  icon: Star,
                },
                {
                  label: 'PDIs',
                  value: employee._count.pdis,
                  icon: TrendingUp,
                },
                {
                  label: 'Docs',
                  value: employee._count.documents,
                  icon: BookOpen,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-surface-sunken rounded-card p-3 text-center"
                >
                  <s.icon size={16} strokeWidth={1.75} className="text-ink-faint mx-auto mb-1" />
                  <p className="text-xl font-bold text-ink">{s.value}</p>
                  <p className="text-xs text-ink-muted">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <a
              href={`/employees/${employee.id}`}
              className={buttonVariants({ intent: 'secondary', size: 'md' })}
            >
              <Eye size={15} strokeWidth={1.75} /> Ver perfil completo
            </a>
            <a
              href={`/employees/${employee.id}/edit`}
              className={buttonVariants({ intent: 'secondary', size: 'md' })}
            >
              <Edit2 size={15} strokeWidth={1.75} /> Editar dados
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
