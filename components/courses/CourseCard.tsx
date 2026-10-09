// components/courses/CourseCard.tsx
// Cartão de curso usado no catálogo. Extraído de
// app/(platform)/courses/page.tsx. Migrado para a fundação de design:
// wrapper clicável passa a Card (sem a prop `interactive` — bug
// conhecido, mesmo padrão de components/learning-paths/LearningPathCard.tsx),
// badge "Obrigatório" passa a Badge.

'use client';

import { Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CourseThumbnail } from './CourseThumbnail';
import { COURSE_LEVEL_MAP, EnrollBadge, fmtDuration } from './shared';
import type { Course, EnrollmentStatus } from './types';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
  enrollmentStatus?: EnrollmentStatus;
  progress?: number;
}

export function CourseCard({
  course,
  onClick,
  enrollmentStatus,
  progress,
}: CourseCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-surface-sunken relative overflow-hidden">
        <CourseThumbnail src={course.thumbnailUrl} alt={course.title} />
        {course.mandatory && (
          <Badge intent="danger" className="absolute top-2 left-2">
            Obrigatório
          </Badge>
        )}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1 bg-ink/20">
              <div
                className="h-1 bg-surface"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Category */}
        {course.category && (
          <div className="text-xs text-primary font-medium mb-1">
            {course.category}
          </div>
        )}
        {/* Title */}
        <div className="text-sm font-semibold text-ink mb-1 line-clamp-2">
          {course.title}
        </div>
        {/* Short desc */}
        {course.shortDescription && (
          <div className="text-xs text-ink-muted mb-2 line-clamp-2">
            {course.shortDescription}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-ink-faint mb-2">
          {course.workloadHours && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} strokeWidth={1.75} />{' '}
              {fmtDuration(course.workloadHours)}
            </span>
          )}
          <StatusBadge value={course.level} map={COURSE_LEVEL_MAP} />
          <span className="inline-flex items-center gap-1">
            <Users size={12} strokeWidth={1.75} /> {course._count.enrollments}
          </span>
        </div>

        {/* Enrollment status */}
        {enrollmentStatus && (
          <EnrollBadge status={enrollmentStatus} deadline={null} />
        )}
      </div>
    </Card>
  );
}
