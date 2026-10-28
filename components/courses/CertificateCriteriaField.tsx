// components/courses/CertificateCriteriaField.tsx
// Critérios para emissão do certificado: lista de critérios habituais ou
// texto manual. O backend guarda uma única string (Course.certificateCriteria),
// por isso a opção escolhida na lista grava o próprio texto do critério.

'use client';

import { useState } from 'react';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export const CERTIFICATE_CRITERIA_PRESETS = [
  'Concluir todos os módulos',
  'Concluir todas as lições',
  'Nota final ≥ 70%',
  'Nota final ≥ 80%',
  'Aprovação em todas as avaliações',
  'Presença mínima de 75%',
  'Concluir módulos e obter nota final ≥ 70%',
];

const MANUAL = '__manual__';
const NONE = '__none__';

export interface CertificateCriteriaFieldProps {
  idPrefix: string;
  value: string;
  onChange: (value: string) => void;
}

export function CertificateCriteriaField({
  idPrefix,
  value,
  onChange,
}: CertificateCriteriaFieldProps) {
  const [manual, setManual] = useState(
    () => value.trim() !== '' && !CERTIFICATE_CRITERIA_PRESETS.includes(value),
  );

  const selected = manual
    ? MANUAL
    : CERTIFICATE_CRITERIA_PRESETS.includes(value)
      ? value
      : NONE;

  const handleSelect = (v: string) => {
    if (v === MANUAL) {
      setManual(true);
      if (CERTIFICATE_CRITERIA_PRESETS.includes(value)) onChange('');
      return;
    }
    setManual(false);
    onChange(v === NONE ? '' : v);
  };

  return (
    <FormField label="Critérios para emissão" htmlFor={`${idPrefix}-select`}>
      <div className="space-y-2">
        <Select
          items={[
            { value: NONE, label: 'Sem critério definido' },
            ...CERTIFICATE_CRITERIA_PRESETS.map((c) => ({
              value: c,
              label: c,
            })),
            { value: MANUAL, label: 'Outro (escrever manualmente)' },
          ]}
          value={selected}
          onValueChange={handleSelect}
          className="w-full"
        />
        {manual && (
          <Input
            id={`${idPrefix}-manual`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            placeholder="Ex: nota final ≥ 70%"
          />
        )}
      </div>
    </FormField>
  );
}
