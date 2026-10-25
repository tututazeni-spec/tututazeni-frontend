// components/users/ProfileTabs.tsx
// Corpo dos separadores do Perfil do Colaborador (docs/modulo_users.md Ponto
// 3) que NÃO são "Resumo"/"Cursos" (esses ficam em UserProfileView.tsx, já
// alimentados por hooks/useUserProfile.ts). Cada separador é um container
// fino: liga o hook de dados (hooks/useUserProfileData.ts) à sua vista de
// apresentação em ./profile/. É montado (e portanto só pedido à API) apenas
// quando `tab === 'x'` em UserProfileView.
//
// Fonte dos dados: por regra de arquitectura do próprio módulo (ver secção
// final de docs/modulo_users.md — "Users não deve ser responsável por tudo o
// que pertence ao RH"), cada separador chama o endpoint do módulo DONO do
// dado, filtrado por userId — nunca duplica essa leitura dentro de Users.

'use client';

import {
  useUserAccess,
  useUserActivity,
  useUserAttendance,
  useUserCareer,
  useUserCompetencies,
  useUserCourses,
  useUserDocuments,
  useUserEvaluations,
  useUserHistory,
  useUserLeave,
  useUserPdi,
  useUserPerformance,
  useUserTeam,
  useUserTraining,
} from '@/hooks/useUserProfileData';
import { AccessView } from './profile/AccessView';
import { ActivityView, HistoryView } from './profile/ActivityViews';
import { hasTeam } from './profile/logic';
import {
  CompetenciesView,
  CoursesView,
  TrainingView,
} from './profile/LearningViews';
import {
  CareerView,
  EvaluationsView,
  PdiView,
  PerformanceView,
} from './profile/PerformanceViews';
import { OrganizationView, TeamView } from './profile/PersonalViews';
import {
  AttendanceView,
  DocumentsView,
  LeaveView,
} from './profile/RecordsViews';
import type { User } from './types';

// Separadores sem fetch: já são só apresentação.
export { PersonalDataTab, ProfessionalDataTab } from './profile/PersonalViews';

interface UserIdProps {
  userId: number;
}

function TeamTab({ managerId }: { managerId: number }) {
  return <TeamView {...useUserTeam(managerId)} />;
}

export function OrganizationTab({ user }: { user: User }) {
  return (
    <OrganizationView
      user={user}
      team={hasTeam(user) ? <TeamTab managerId={user.id} /> : null}
    />
  );
}

export function AccessTab({ userId }: UserIdProps) {
  return <AccessView {...useUserAccess(userId)} />;
}

export function TrainingTab({ userId }: UserIdProps) {
  return <TrainingView {...useUserTraining(userId)} />;
}

export function CoursesTab({ userId }: UserIdProps) {
  return <CoursesView {...useUserCourses(userId)} />;
}

export function CompetenciesTab({ userId }: UserIdProps) {
  return <CompetenciesView {...useUserCompetencies(userId)} />;
}

export function PerformanceTab({ userId }: UserIdProps) {
  return <PerformanceView {...useUserPerformance(userId)} />;
}

export function EvaluationsTab({ userId }: UserIdProps) {
  return <EvaluationsView {...useUserEvaluations(userId)} />;
}

export function PdiTab({ userId }: UserIdProps) {
  return <PdiView {...useUserPdi(userId)} />;
}

export function CareerTab({ userId }: UserIdProps) {
  return <CareerView {...useUserCareer(userId)} />;
}

export function DocumentsTab({ userId }: UserIdProps) {
  return <DocumentsView {...useUserDocuments(userId)} />;
}

export function LeaveTab({ userId }: UserIdProps) {
  return <LeaveView {...useUserLeave(userId)} />;
}

export function AttendanceTab({ userId }: UserIdProps) {
  return <AttendanceView {...useUserAttendance(userId)} />;
}

export function HistoryTab({ userId }: UserIdProps) {
  return <HistoryView {...useUserHistory(userId)} />;
}

export function ActivityTab({ userId }: UserIdProps) {
  return <ActivityView {...useUserActivity(userId)} />;
}
