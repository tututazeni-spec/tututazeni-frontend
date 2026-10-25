// components/users/profile/PersonalViews.tsx
// Dados pessoais, profissionais e organização (apresentação). Linhas: ./logic.ts.

import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { QueryData } from '@/hooks/useUserProfileData';
import { InfoCard, LoadingRows } from './shared';
import {
  contactRows,
  employmentRows,
  identificationRows,
  overdueClass,
  regimeRows,
  structureRows,
  subordinatesCount,
} from './logic';
import {
  ACCOUNT_STATUS_MAP,
  HR_STATUS_MAP,
  type User,
  type TeamResponse,
} from '../types';

export function PersonalDataTab({ user }: { user: User }) {
  return (
    <div className="grid grid-cols-2 gap-5">
      <InfoCard title="Identificação" rows={identificationRows(user)} />
      <InfoCard title="Contacto" rows={contactRows(user)} />
    </div>
  );
}

export function ProfessionalDataTab({ user }: { user: User }) {
  return (
    <div className="grid grid-cols-2 gap-5">
      <InfoCard title="Vínculo" rows={employmentRows(user)} />
      <InfoCard
        title="Regime"
        rows={[
          ...regimeRows(user),
          [
            'Estado do colaborador',
            <StatusBadge key="hr" value={user.hrStatus} map={HR_STATUS_MAP} />,
          ],
        ]}
      />
    </div>
  );
}

export function TeamView({
  data,
  isLoading: loading,
}: QueryData<TeamResponse>) {
  if (loading) return <LoadingRows />;
  if (!data || data.team.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
        Equipa directa
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Colaborador</TableHeaderCell>
            <TableHeaderCell>Concluídos</TableHeaderCell>
            <TableHeaderCell>Em curso</TableHeaderCell>
            <TableHeaderCell>Atrasos</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.team.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar
                    name={member.fullName}
                    url={member.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {member.fullName}
                    </div>
                    <div className="text-xs text-ink-faint">
                      {member.position?.name ?? '—'}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-success font-mono">
                {member.learningStats.completed}
              </TableCell>
              <TableCell className="text-sm text-info font-mono">
                {member.learningStats.inProgress}
              </TableCell>
              <TableCell
                className={`text-sm font-mono ${overdueClass(member.learningStats.overdue)}`}
              >
                {member.learningStats.overdue}
              </TableCell>
              <TableCell>
                <StatusBadge
                  value={member.accountStatus}
                  map={ACCOUNT_STATUS_MAP}
                  variant="dot"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function OrganizationView({
  user,
  team,
}: {
  user: User;
  /** Equipa directa, injectada pelo container (tem o seu próprio hook). */
  team: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <InfoCard title="Estrutura" rows={structureRows(user)} />
        <InfoCard
          title="Hierarquia"
          rows={[
            [
              'Gestor directo',
              user.manager ? (
                <span key="mgr" className="inline-flex items-center gap-2">
                  <Avatar
                    name={user.manager.fullName}
                    url={user.manager.avatarUrl ?? undefined}
                    size="sm"
                  />
                  {user.manager.fullName}
                </span>
              ) : null,
            ],
            ['Subordinados directos', subordinatesCount(user)],
          ]}
        />
      </div>
      {team}
    </div>
  );
}
