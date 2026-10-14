'use client';

import { useEffect } from 'react';
import { logout, refreshSession } from '../lib/apiClient';
import { startSessionActivity } from '../lib/sessionActivity';

/** Sem UI: renova a sessão enquanto há actividade e expira após 30 min inactivo. */
export function SessionActivityTracker() {
  useEffect(
    () => startSessionActivity(refreshSession, () => logout('expired')),
    [],
  );
  return null;
}
