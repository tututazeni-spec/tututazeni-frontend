// components/courses-modulos/modalReducer.ts
// Máquina de estados explícita para o modal activo (módulo / lição /
// progresso) — evita combinações de estado impossíveis. Extraído de
// app/(platform)/courses/modulos/page.tsx.

import type { CourseModule, Lesson } from './types';

export type ModalState =
  | { kind: 'none' }
  | { kind: 'module'; editing: CourseModule | null }
  | { kind: 'lesson'; moduleId: number; editing: Lesson | null }
  | { kind: 'progress' };

export type ModalAction =
  | { type: 'openNewModule' }
  | { type: 'openEditModule'; mod: CourseModule }
  | { type: 'openNewLesson'; moduleId: number }
  | { type: 'openEditLesson'; moduleId: number; lesson: Lesson }
  | { type: 'openProgress' }
  | { type: 'close' };

export function modalReducer(
  _state: ModalState,
  action: ModalAction,
): ModalState {
  switch (action.type) {
    case 'openNewModule':
      return { kind: 'module', editing: null };
    case 'openEditModule':
      return { kind: 'module', editing: action.mod };
    case 'openNewLesson':
      return { kind: 'lesson', moduleId: action.moduleId, editing: null };
    case 'openEditLesson':
      return {
        kind: 'lesson',
        moduleId: action.moduleId,
        editing: action.lesson,
      };
    case 'openProgress':
      return { kind: 'progress' };
    case 'close':
      return { kind: 'none' };
  }
}
