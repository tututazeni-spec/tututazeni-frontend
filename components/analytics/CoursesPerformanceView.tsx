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
import { ClipboardCheck, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { CoursePerformance } from './types';

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
      <NavyStatCard
        icon={Star}
        label="Feedback médio"
        value={rating != null ? `${rating.toFixed(1)} ★` : '—'}
        sub={rating != null ? `${feedbackCount} avaliações` : 'Sem feedback'}
        tone="orange"
      />
      <NavyStatCard
        icon={ClipboardCheck}
        label="Nota média de avaliação"
        value={score != null ? score.toFixed(1) : '—'}
        sub={score != null ? `${attempts} tentativas` : 'Sem tentativas'}
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
        <TableHead className="bg-[#0F1F3D]">
          <TableRow className="hover:bg-transparent">
            <TableHeaderCell className="text-white">Curso</TableHeaderCell>
            <TableHeaderCell className="text-white">Categoria</TableHeaderCell>
            <TableHeaderCell className="text-white">Nível</TableHeaderCell>
            <TableHeaderCell className="text-white">Matrículas</TableHeaderCell>
            <TableHeaderCell className="text-white">Concluídas</TableHeaderCell>
            <TableHeaderCell className="text-white">Nota média</TableHeaderCell>
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
