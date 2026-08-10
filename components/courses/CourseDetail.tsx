// components/courses/CourseDetail.tsx
// Container: useCourseDetail trata as queries de curso/progresso, a
// auto-selecção da 1ª aula incompleta e as 3 mutações; a apresentação
// (player/header/módulos/feedback) vive em
// components/courses/CourseDetailView.tsx. Extraído de
// app/(platform)/courses/page.tsx.

'use client';

import { useCourseDetail } from '@/hooks/useCourseDetail';
import { CourseDetailView } from './CourseDetailView';

interface CourseDetailProps {
  courseId: number;
  onBack: () => void;
}

export function CourseDetail({ courseId, onBack }: CourseDetailProps) {
  const {
    course,
    loadingCourse,
    progress,
    isEnrolled,
    progressPct,
    activeLesson,
    setActiveLesson,
    rating,
    setRating,
    comment,
    setComment,
    handleEnroll,
    handleMarkComplete,
    handleFeedback,
    enrolling,
    completing,
    feedbackLoading,
  } = useCourseDetail(courseId);

  return (
    <CourseDetailView
      onBack={onBack}
      course={course}
      loadingCourse={loadingCourse}
      progress={progress}
      isEnrolled={isEnrolled}
      progressPct={progressPct}
      activeLesson={activeLesson}
      onSelectLesson={setActiveLesson}
      rating={rating}
      onRatingChange={setRating}
      comment={comment}
      onCommentChange={setComment}
      onEnroll={handleEnroll}
      onMarkComplete={handleMarkComplete}
      onFeedback={handleFeedback}
      enrolling={enrolling}
      completing={completing}
      feedbackLoading={feedbackLoading}
    />
  );
}
