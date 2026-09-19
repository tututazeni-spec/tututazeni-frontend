// components/live-classes/wizard/wizardTypes.ts
// Estado local do assistente "Nova Aula" — todos os campos como string para
// ligar directamente a inputs; convertidos aos tipos reais só no submit
// (ver CreateLiveClassWizard.tsx#buildPayload).

import type {
  LiveClassEnrollmentMode,
  LiveClassRecurrence,
  LiveClassType,
  SessionModality,
} from '../types';

export interface WizardForm {
  // Etapa 1 — Informações gerais
  topic: string;
  code: string;
  description: string;
  type: LiveClassType;
  courseId: string;
  moduleId: string;
  lessonId: string;
  instructorId: string;
  coInstructorId: string;

  // Etapa 2 — Data e horário / recorrência
  scheduledAt: string;
  duration: string;
  timezone: string;
  recurrence: LiveClassRecurrence;
  recurrenceEndDate: string;
  recurrenceDaysOfWeek: string[];

  // Etapa 3 — Modalidade
  modality: SessionModality;
  zoomMeetingId: string;
  location: string;
  building: string;
  room: string;
  capacity: string;

  // Etapa 4 — Participantes
  enrollmentMode: LiveClassEnrollmentMode;
  maxParticipants: string;
  waitlistEnabled: boolean;
  targetDeptIds: number[];
  targetUnitIds: number[];
  targetPositionIds: number[];

  // Etapa 5 — Conteúdo
  objectives: string;
  agenda: string;
  topics: string;
  materialDocumentIds: string;

  // Etapa 6 — Presença
  attendanceAutoRegister: boolean;
  attendanceRequired: boolean;
  minAttendancePercent: string;
  lateToleranceMinutes: string;

  // Etapa 7 — Gravação
  recordSession: boolean;
  recordingExpiresAt: string;
  allowRecordingDownload: boolean;

  // Etapa 8 — Avaliação
  evaluationRequired: boolean;

  // Etapa 9 — Notificações
  notifyOnEnroll: boolean;
  notifyReminder24h: boolean;
  notifyReminder1h: boolean;
  notifyOnStart: boolean;
  notifyOnReschedule: boolean;
  notifyOnCancel: boolean;
  notifyOnRecordingAvailable: boolean;
}

export const EMPTY_WIZARD_FORM: WizardForm = {
  topic: '',
  code: '',
  description: '',
  type: 'AULA',
  courseId: '',
  moduleId: '',
  lessonId: '',
  instructorId: '',
  coInstructorId: '',

  scheduledAt: '',
  duration: '60',
  timezone: 'Europe/Lisbon',
  recurrence: 'ONCE',
  recurrenceEndDate: '',
  recurrenceDaysOfWeek: [],

  modality: 'ONLINE',
  zoomMeetingId: '',
  location: '',
  building: '',
  room: '',
  capacity: '',

  enrollmentMode: 'MANUAL',
  maxParticipants: '',
  waitlistEnabled: false,
  targetDeptIds: [],
  targetUnitIds: [],
  targetPositionIds: [],

  objectives: '',
  agenda: '',
  topics: '',
  materialDocumentIds: '',

  attendanceAutoRegister: true,
  attendanceRequired: false,
  minAttendancePercent: '70',
  lateToleranceMinutes: '10',

  recordSession: true,
  recordingExpiresAt: '',
  allowRecordingDownload: false,

  evaluationRequired: false,

  notifyOnEnroll: true,
  notifyReminder24h: true,
  notifyReminder1h: false,
  notifyOnStart: false,
  notifyOnReschedule: true,
  notifyOnCancel: true,
  notifyOnRecordingAvailable: false,
};
