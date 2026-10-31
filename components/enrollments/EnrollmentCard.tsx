// components/enrollments/EnrollmentCard.tsx
// Cartão de matrícula na vista do learner. O desenho é o mesmo do cartão da
// vista de gestão (AdminEnrollmentCard) — só mudam a informação e os botões:
// aqui o painel leva a imagem do curso e os botões abrem/continuam a aula.

'use client';

import {
  AlertTriangle,
  BookOpen,
  Award,
  CheckCircle2,
  Hourglass,
  TrendingUp,
} from 'lucide-react';
import {
  AdminEnrollmentCard,
  ADMIN_ENROLLMENT_BTN_GHOST,
  ADMIN_ENROLLMENT_BTN_PRIMARY,
  type AdminEnrollmentInfo,
} from './AdminEnrollmentCard';
import { STATUS_CFG, STATUS_TONE } from './constants';
import { deadlineCountdown } from './utils';
import type { Enrollment } from './types';

interface EnrollmentCardProps {
  enrollment: Enrollment;
  onCancel?: (id: number) => void;
}

export function EnrollmentCard({ enrollment, onCancel }: EnrollmentCardProps) {
  const {
    course,
    status,
    mandatory,
    isOverdue,
    progressPercent,
    completedLessons,
    totalLessons,
    deadline,
  } = enrollment;
  const href = `/courses/${enrollment.courseId}/learn`;

  const infos: AdminEnrollmentInfo[] = [];
  if (status !== 'NOT_STARTED' && status !== 'CANCELLED' && totalLessons > 0) {
    infos.push({
      icon: TrendingUp,
      text: `Progresso: ${progressPercent}% · ${completedLessons}/${totalLessons} aulas`,
      danger: isOverdue,
    });
  }
  if (deadline) {
    infos.push({
      icon: isOverdue ? AlertTriangle : Hourglass,
      text: `Prazo limite: ${deadlineCountdown(deadline)}`,
      danger: isOverdue,
    });
  }
  if (enrollment.certificate) {
    infos.push({ icon: Award, text: 'Certificado disponível' });
  }
  if (infos.length === 0) {
    infos.push({ icon: BookOpen, text: 'Ainda sem progresso' });
  }

  return (
    <AdminEnrollmentCard
      seed={enrollment.courseId}
      title={course.title}
      subtitle={course.category ?? undefined}
      avatar={{ name: course.title, url: course.thumbnailUrl }}
      status={{
        label: STATUS_CFG[status]?.label ?? status,
        tone: STATUS_TONE[status] ?? 'neutral',
      }}
      tags={mandatory ? ['Obrigatório'] : []}
      infos={infos}
      actions={
        <>
          {!mandatory &&
            status !== 'COMPLETED' &&
            status !== 'CANCELLED' &&
            onCancel && (
              <button
                type="button"
                onClick={() => onCancel(enrollment.id)}
                className={ADMIN_ENROLLMENT_BTN_GHOST}
              >
                Cancelar
              </button>
            )}
          {status === 'NOT_STARTED' && (
            <a href={href} className={ADMIN_ENROLLMENT_BTN_PRIMARY}>
              Iniciar →
            </a>
          )}
          {status === 'IN_PROGRESS' && (
            <a href={href} className={ADMIN_ENROLLMENT_BTN_PRIMARY}>
              Continuar →
            </a>
          )}
          {status === 'OVERDUE' && (
            <a href={href} className={ADMIN_ENROLLMENT_BTN_PRIMARY}>
              <AlertTriangle size={14} strokeWidth={1.75} />
              Iniciar agora →
            </a>
          )}
          {status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-success-ink">
              <CheckCircle2 size={15} strokeWidth={1.75} />
              Concluído
            </span>
          )}
        </>
      }
    />
  );
}
