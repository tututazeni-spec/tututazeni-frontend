'use client';

// ─── app/(dashboard)/leave/page.tsx ──────────────────────────────────────────
// INNOVA — Módulo Leave (férias, licenças e gestão de ausências)
//
// Container: estrutura de 9 abas de docs/Modulo_Leave.md §1. Visão Geral
// (§2), Férias (§3), Licenças (§4), Gestão de Ausências (§5), Calendário (§6),
// Aprovações (§7), Planeamento de Equipas (§8), Relatórios (§9) e
// Configurações (§10) estão implementadas. Configurações é partilhada: ADMIN/RH
// mantêm as regras; os restantes aprovadores só gerem as suas substituições.
//
// O número de pendentes alimenta o badge do separador "Aprovações" (a lista
// em si é carregada pelo próprio separador).
// Ver memory project_innova_component_separation_audit.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useLeaveTypes, usePendingApprovals } from '@/hooks/useLeave';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/cn';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { filterByRole, type Role } from '@/lib/roles';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Palmtree,
  Plus,
  RefreshCcw,
  ScrollText,
  Settings,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { AbsenceCalendarTab } from '@/components/leave/AbsenceCalendarTab';
import { AbsencesTab } from '@/components/leave/AbsencesTab';
import { ApprovalsTab } from '@/components/leave/ApprovalsTab';
import { LicensesTab } from '@/components/leave/LicensesTab';
import { NewLicenseModal } from '@/components/leave/NewLicenseModal';
import { OverviewTab } from '@/components/leave/OverviewTab';
import { PlanningTab } from '@/components/leave/PlanningTab';
import { ReportsTab } from '@/components/leave/ReportsTab';
import { SettingsTab } from '@/components/leave/SettingsTab';
import { VacationsTab } from '@/components/leave/VacationsTab';

type TabKey =
  | 'overview'
  | 'vacations'
  | 'leaves'
  | 'absences'
  | 'calendar'
  | 'approvals'
  | 'planning'
  | 'reports'
  | 'settings';

// GET /leave/pending-approvals exige @Roles(ADMIN, RH, GESTOR) em
// leave-management.controller.ts — um COLABORADOR não tem acesso. Partilhado
// entre o filtro de tabs e o `enabled` da query: sem o segundo, o pedido
// disparava sempre no mount e rebentava com 403 em "query:leave".
const LEAVE_APPROVER_ROLES: Role[] = ['ADMIN', 'RH', 'GESTOR'];
const LEAVE_ADMIN_ROLES: Role[] = ['ADMIN', 'RH'];

export default function LeavePage() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [showModal, setShowModal] = useState(false);
  const notify = useToast();
  const role = useCurrentRole();
  // `!!role &&` (não "deixar passar enquanto undefined"): isto controla
  // pedidos de rede reais, não só visibilidade de UI — ver isRoleAllowed em
  // lib/roles.ts para a distinção.
  const isApprover = !!role && LEAVE_APPROVER_ROLES.includes(role);

  const queryClient = useQueryClient();
  const leaveTypes = useLeaveTypes();
  // Licenças: tudo menos férias (que têm o seu próprio fluxo na aba Férias).
  const licenseTypes = leaveTypes.filter(
    (t) => t.code !== 'VACATION' && t.active,
  );
  const { data: pending, refetch: pRefetch } = usePendingApprovals(isApprover);

  const cancel = useApiMutation(
    (id: number) => apiClient.patch(`/leave/${id}/cancel`, {}),
    {
      invalidateKeys: [queryKeys.leave.all],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const confirm = useConfirm();
  const handleCancel = async (requestId: number) => {
    if (
      !(await confirm({
        title: 'Cancelar este pedido?',
        message: 'Tem a certeza?',
        confirmLabel: 'Cancelar pedido',
        destructive: true,
      }))
    )
      return;
    cancel.mutate(requestId);
  };

  const allTabs: Array<{
    key: TabKey;
    label: string;
    icon: LucideIcon;
    badge?: number;
    roles?: Role[];
  }> = [
    { key: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { key: 'vacations', label: 'Férias', icon: Palmtree },
    { key: 'leaves', label: 'Licenças', icon: ScrollText },
    { key: 'absences', label: 'Gestão de Ausências', icon: ClipboardList },
    { key: 'calendar', label: 'Calendário de Ausências', icon: CalendarDays },
    {
      key: 'approvals',
      label: 'Aprovações',
      icon: CheckCircle2,
      badge: pending.length,
      roles: LEAVE_APPROVER_ROLES,
    },
    {
      key: 'planning',
      label: 'Planeamento de Equipas',
      icon: Users,
      roles: LEAVE_APPROVER_ROLES,
    },
    {
      key: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
      roles: LEAVE_ADMIN_ROLES,
    },
    {
      key: 'settings',
      label: 'Configurações',
      icon: Settings,
      roles: LEAVE_APPROVER_ROLES,
    },
  ];
  const tabs = filterByRole(allTabs, role);
  const hasTab = (key: TabKey) => tabs.some((t) => t.key === key);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-ink">
              Férias e Ausências
            </h1>
            <p className="text-sm text-ink-muted">
              Férias, licenças e gestão de ausências
            </p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              icon={RefreshCcw}
              label="Actualizar"
              intent="secondary"
              onClick={() => {
                pRefetch();
                queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
              }}
            />
            <Button onClick={() => setShowModal(true)}>
              <Plus size={15} strokeWidth={1.75} /> Nova licença
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Tab bar */}
        <div className="flex bg-surface rounded-panel border border-border shadow-resting p-1.5 gap-1 w-full overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm rounded-control font-medium transition-colors relative whitespace-nowrap',
                tab === t.key
                  ? 'bg-primary text-canvas shadow-resting'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-sunken',
              )}
            >
              <t.icon size={15} strokeWidth={1.75} />
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span
                  className={cn(
                    'w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold',
                    tab === t.key
                      ? 'bg-canvas text-primary'
                      : 'bg-primary text-canvas',
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab leaveTypes={leaveTypes} />}

        {tab === 'vacations' && <VacationsTab />}

        {tab === 'leaves' && (
          <LicensesTab leaveTypes={leaveTypes} onCancel={handleCancel} />
        )}

        {tab === 'absences' && <AbsencesTab />}

        {tab === 'calendar' && <AbsenceCalendarTab leaveTypes={leaveTypes} />}

        {/* Os separadores abaixo não são montados para quem não tem o
            perfil exigido no backend — não só escondidos da tab bar. */}
        {tab === 'approvals' && hasTab('approvals') && (
          <ApprovalsTab leaveTypes={leaveTypes} />
        )}

        {tab === 'planning' && hasTab('planning') && <PlanningTab />}

        {tab === 'reports' && hasTab('reports') && (
          <ReportsTab leaveTypes={leaveTypes} />
        )}

        {tab === 'settings' && hasTab('settings') && (
          <SettingsTab isAdmin={!!role && LEAVE_ADMIN_ROLES.includes(role)} />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NewLicenseModal
          leaveTypes={licenseTypes}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setTab('leaves');
          }}
        />
      )}
    </div>
  );
}
