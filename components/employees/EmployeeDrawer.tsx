// components/employees/EmployeeDrawer.tsx
// Painel lateral de pré-visualização rápida do colaborador. Extraído do
// JSX inline "Quick Preview Drawer" de app/(platform)/employees/page.tsx —
// era o maior bloco de apresentação ainda dentro da página principal
// (~156 linhas).

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
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';
import { CONTRACT_LABELS, SENIORITY_LABELS } from './constants';

export interface EmployeeDrawerProps {
  employee: Employee;
  onClose: () => void;
}

export function EmployeeDrawer({ employee, onClose }: EmployeeDrawerProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar src={employee.avatarUrl} name={employee.name} size="lg" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {employee.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {employee.jobTitle ?? employee.role}
                </p>
                {employee.matricula && (
                  <p className="text-xs font-mono text-gray-400 mt-0.5">
                    {employee.matricula}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <StatusBadge status={employee.status} />

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
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <row.icon size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 w-24 flex-shrink-0">
                    {row.label}
                  </span>
                  <span className="text-sm font-medium text-gray-900 flex-1">
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
                  className="bg-gray-50 rounded-xl p-3 text-center"
                >
                  <s.icon size={16} className="text-gray-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <a
              href={`/employees/${employee.id}`}
              className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Eye size={15} /> Ver perfil completo
            </a>
            <a
              href={`/employees/${employee.id}/edit`}
              className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={15} /> Editar dados
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
