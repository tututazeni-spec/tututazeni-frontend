// components/users/createUser/constants.ts
// Opções fixas dos selectores do formulário «Novo Utilizador».

import type { ComboboxOption } from '@/components/ui/Combobox';
import {
  CONTRACT_LABELS,
  WORKMODE_LABELS,
} from '@/components/employees/constants';
import { ACCOUNT_STATUS_MAP, HR_STATUS_MAP } from '../types';

export const GENDER_OPTIONS: ComboboxOption[] = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
];

export const CONTRACT_TYPE_OPTIONS: ComboboxOption[] = Object.entries(
  CONTRACT_LABELS,
).map(([value, label]) => ({ value, label }));
export const WORK_MODE_OPTIONS: ComboboxOption[] = Object.entries(
  WORKMODE_LABELS,
).map(([value, label]) => ({ value, label }));
export const HR_STATUS_OPTIONS: ComboboxOption[] = Object.entries(
  HR_STATUS_MAP,
).map(([value, cfg]) => ({ value, label: cfg.label }));
export const ACCOUNT_STATUS_OPTIONS: ComboboxOption[] = Object.entries(
  ACCOUNT_STATUS_MAP,
).map(([value, cfg]) => ({ value, label: cfg.label }));
export const LANGUAGE_OPTIONS: ComboboxOption[] = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' },
];
