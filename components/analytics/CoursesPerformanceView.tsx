// components/analytics/CoursesPerformanceView.tsx
// Separador "Cursos" — GET /analytics/courses, com drill-down por curso via
// GET /analytics/courses/:courseId (feedback + avaliação, modal). Ambos os
// endpoints já existiam no backend sem nenhum consumidor no frontend.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Modal, ModalContent } from '@/components/ui/Modal';
import type { LucideIcon } from 'lucide-react';
import { ClipboardCheck, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { CoursePerformance } from './types';

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-4 pt-5">
        <Icon size={20} strokeWidth={1.75} className={t.text} />
        <p className={`mt-2 font-display text-2xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-xs font-medium text-ink-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

function CourseDetail({ courseId }: { courseId: number }) {
  const { data, isLoading } = useApiQuery<CoursePerformance>(
    queryKeys.analyticsPage.courseDetail(courseId),
    `/analytics/courses/${courseId}`,
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={2} />;

  const rating = data.feedbackStats?._avg.rating ?? null;
  const feedbackCount = data.feedbackStats?._count ?? 0;
  const score = data.assessmentStats?._avg.score ?? null;
  const attempts = data.assessmentStats?._count ?? 0;

  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <TopBarKpiCard
        icon={Star}
        label="Feedback médio"
        value={
          rating != null
            ? `${rating.toFixed(1)} ★ (${feedbackCount})`
            : 'Sem feedback'
        }
        tone="gold"
      />
      <TopBarKpiCard
        icon={ClipboardCheck}
        label="Nota média de avaliação"
        value={
          score != null
            ? `${score.toFixed(1)} (${attempts} tentativas)`
            : 'Sem tentativas'
        }
        tone="blue"
      />
    </div>
  );
}

export function CoursesPerformanceView() {
  const [openCourseId, setOpenCourseId] = useState<number | null>(null);
  const { data, isLoading } = useApiQuery<CoursePerformance>(
    queryKeys.analyticsPage.courses(),
    '/analytics/courses',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  const openCourse = data.analytics.find((c) => c.courseId === openCourseId);

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Curso</TableHeaderCell>
            <TableHeaderCell>Categoria</TableHeaderCell>
            <TableHeaderCell>Nível</TableHeaderCell>
            <TableHeaderCell>Matrículas</TableHeaderCell>
            <TableHeaderCell>Concluídas</TableHeaderCell>
            <TableHeaderCell>Nota média</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.analytics.map((c) => (
            <TableRow
              key={c.id}
              className="cursor-pointer"
              onClick={() => setOpenCourseId(c.courseId)}
            >
              <TableCell className="font-medium text-ink">
                {c.course.title}
              </TableCell>
              <TableCell>{c.course.category ?? '—'}</TableCell>
              <TableCell>{c.course.level ?? '—'}</TableCell>
              <TableCell>{c.totalEnrollments}</TableCell>
              <TableCell>{c.totalCompleted}</TableCell>
              <TableCell>
                {c.avgRating > 0 ? `${c.avgRating.toFixed(1)} ★` : '—'}
              </TableCell>
            </TableRow>
          ))}
          {data.analytics.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-ink-faint py-6"
              >
                Sem dados de performance de cursos
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        open={openCourseId !== null}
        onOpenChange={(o) => !o && setOpenCourseId(null)}
      >
        <ModalContent title={openCourse?.course.title ?? 'Curso'}>
          {openCourseId !== null && <CourseDetail courseId={openCourseId} />}
        </ModalContent>
      </Modal>
    </>
  );
}
