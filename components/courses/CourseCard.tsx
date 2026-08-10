// components/courses/CourseCard.tsx
// Cartão de curso usado no catálogo. Extraído de
// app/(platform)/courses/page.tsx.

'use client';

import Image from 'next/image';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
    <div
      className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            📚
          </div>
        )}
        {course.mandatory && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded">
            Obrigatório
          </span>
        )}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1 bg-gray-200">
              <div
                className="h-1 bg-blue-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Category */}
        {course.category && (
          <div className="text-xs text-blue-600 font-medium mb-1">
            {course.category}
          </div>
        )}
        {/* Title */}
        <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
          {course.title}
        </div>
        {/* Short desc */}
        {course.shortDescription && (
          <div className="text-xs text-gray-500 mb-2 line-clamp-2">
            {course.shortDescription}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
          {course.workloadHours && (
            <span>⏱ {fmtDuration(course.workloadHours)}</span>
          )}
          <StatusBadge value={course.level} map={COURSE_LEVEL_MAP} />
          <span>👥 {course._count.enrollments}</span>
        </div>

        {/* Enrollment status */}
        {enrollmentStatus && (
          <EnrollBadge status={enrollmentStatus} deadline={null} />
        )}
      </div>
    </div>
  );
}
