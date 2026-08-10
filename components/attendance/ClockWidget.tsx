// components/attendance/ClockWidget.tsx
// Container: useClockInOut trata a query do dia, a inicialização a partir
// do servidor e as mutações; a apresentação (relógio ao vivo + JSX) vive em
// components/attendance/ClockWidgetView.tsx. Extraído de
// app/(platform)/attendance/page.tsx.

'use client';

import { useClockInOut } from '@/hooks/useClockInOut';
import { ClockWidgetView } from './ClockWidgetView';

interface ClockWidgetProps {
  onAction: () => void;
}

export function ClockWidget({ onAction }: ClockWidgetProps) {
  const {
    status,
    clockInTime,
    error,
    notes,
    setNotes,
    loading,
    handleClockIn,
    handleClockOut,
  } = useClockInOut(onAction);

  return (
    <ClockWidgetView
      status={status}
      clockInTime={clockInTime}
      error={error}
      notes={notes}
      onNotesChange={setNotes}
      loading={loading}
      onClockIn={handleClockIn}
      onClockOut={handleClockOut}
    />
  );
}
