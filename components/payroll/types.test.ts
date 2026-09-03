import { describe, expect, test } from 'vitest';
import {
  RUN_STATUS_MAP,
  EXCEPTION_SEVERITY_MAP,
  EXCEPTION_CODE_LABEL,
} from './types';

// Mirrors prisma/schema.prisma enum PayrollRunStatus exactly (innova repo) —
// including CALCULATED, which no service sets but the type must still cover.
const ALL_RUN_STATUSES = [
  'DRAFT',
  'PROCESSING',
  'SIMULATED',
  'PENDING_APPROVAL',
  'CALCULATED',
  'APPROVED',
  'PUBLISHED',
  'CANCELLED',
] as const;

// Mirrors the 8 codes in src/payslips/payroll-calculation.service.ts (innova repo).
const ALL_EXCEPTION_CODES = [
  'NO_COMPENSATION',
  'ZERO_BASE_SALARY',
  'NEGATIVE_NET',
  'DUPLICATE_PAYSLIP_FOR_PERIOD',
  'NET_BELOW_MINIMUM_WAGE',
  'MISSING_BANK_DETAILS',
  'HIGH_VARIANCE_VS_PREV_MONTH',
  'USING_FALLBACK_TAX_CONFIG',
] as const;

describe('payroll status maps', () => {
  test('RUN_STATUS_MAP has a label for every PayrollRunStatus value', () => {
    for (const s of ALL_RUN_STATUSES) {
      expect(RUN_STATUS_MAP[s]).toBeDefined();
      expect(RUN_STATUS_MAP[s].label.length).toBeGreaterThan(0);
    }
  });

  test('EXCEPTION_SEVERITY_MAP has ERROR and WARNING', () => {
    expect(EXCEPTION_SEVERITY_MAP.ERROR).toBeDefined();
    expect(EXCEPTION_SEVERITY_MAP.WARNING).toBeDefined();
  });

  test('EXCEPTION_CODE_LABEL covers every known exception code', () => {
    for (const c of ALL_EXCEPTION_CODES) {
      expect(EXCEPTION_CODE_LABEL[c]).toBeDefined();
    }
  });
});
