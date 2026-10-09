// components/leave/HolidaysPanel.tsx
// Calendário de feriados por localização (docs/Modulo_Leave.md §10). Mostra os
// feriados efectivos do ano (base + personalizados) para a localização
// escolhida e permite acrescentar, suprimir ou remover feriados. As alterações
// entram de imediato na contagem de dias úteis de todos os pedidos novos.

'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useHolidayLocations, useHolidays } from '@/hooks/useLeave';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type { CustomHoliday } from './types';

const NATIONAL = '__national__';

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export function HolidaysPanel() {
  const notify = useToast();
  const confirm = useConfirm();
  const [year, setYear] = useState(new Date().getFullYear());
  const [location, setLocation] = useState(NATIONAL);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [recurring, setRecurring] = useState(false);

  const locations = useHolidayLocations(true);
  const { data, loading } = useHolidays(
    year,
    location === NATIONAL ? '' : location,
    true,
  );

  const locationItems = [
    { value: NATIONAL, label: 'Nacional (todas as localizações)' },
    ...locations.map((l) => ({ value: l, label: l })),
  ];

  const invalidate = [queryKeys.leave.all];
  const onError = (e: Error) => notify({ title: e.message, intent: 'danger' });

  const add = useApiMutation(
    (body: {
      name: string;
      date: string;
      location?: string;
      recurring?: boolean;
      active?: boolean;
    }) => apiClient.post('/leave/settings/holidays', body),
    {
      invalidateKeys: invalidate,
      onSuccess: () => {
        setName('');
        setDate('');
        setRecurring(false);
        notify({ title: 'Feriado guardado', intent: 'success' });
      },
      onError,
    },
  );

  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/leave/settings/holidays/${id}`),
    {
      invalidateKeys: invalidate,
      onSuccess: () => notify({ title: 'Feriado removido', intent: 'success' }),
      onError,
    },
  );

  const loc = location === NATIONAL ? undefined : location;

  const submit = () => {
    if (!name.trim() || !date) return;
    add.mutate({ name: name.trim(), date, location: loc, recurring });
  };

  const suppress = async (h: { date: string; name: string }) => {
    if (
      !(await confirm({
        title: 'Suprimir este feriado?',
        message: `"${h.name}" (${fmtDate(h.date)}) deixa de contar como feriado${
          loc ? ` em ${loc}` : ''
        }. Pode repor removendo a supressão.`,
        confirmLabel: 'Suprimir',
        destructive: true,
      }))
    )
      return;
    add.mutate({ name: h.name, date: h.date, location: loc, active: false });
  };

  const customHere: CustomHoliday[] = (data?.custom ?? []).filter(
    (c) =>
      (loc ? c.location === loc || c.location === null : c.location === null) &&
      (c.recurring || c.date.startsWith(String(year))),
  );

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_8rem] items-end">
        <h3 className="col-span-full -mx-4 -mt-4 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">Localização e ano</h3>
        <FormField label="Localização" htmlFor="holiday-location">
          <Select
            items={locationItems}
            value={location}
            onValueChange={setLocation}
            className="w-full"
          />
        </FormField>
        <FormField label="Ano" htmlFor="holiday-year">
          <Input
            id="holiday-year"
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 2000 && n <= 2100) setYear(n);
            }}
            className="w-full"
          />
        </FormField>
      </Card>

      <Card className="overflow-hidden p-4 space-y-3">
        <h3 className="-mx-4 -mt-4 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">Acrescentar feriado</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_11rem_auto_auto] items-end">
          <FormField label="Nome" htmlFor="holiday-name">
            <Input
              id="holiday-name"
              value={name}
              maxLength={120}
              placeholder="Ex.: Dia da Cidade"
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Data" htmlFor="holiday-date">
            <Input
              id="holiday-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </FormField>
          <label className="flex items-center gap-2 pb-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Repete todos os anos
          </label>
          <Button
            loading={add.isPending}
            disabled={!name.trim() || !date}
            onClick={submit}
          >
            <Plus size={16} strokeWidth={1.75} />
            Adicionar
          </Button>
        </div>
        <p className="text-xs text-ink-faint">
          {loc
            ? `Aplica-se só aos colaboradores com localização "${loc}".`
            : 'Aplica-se a todos os colaboradores.'}
        </p>
      </Card>

      <Card className="overflow-hidden p-4">
        <h3 className="-mx-4 -mt-4 mb-3 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">
          Feriados em {year}
          {loc ? ` — ${loc}` : ''}
        </h3>
        {loading && !data ? (
          <Skeleton rows={4} />
        ) : (
          <ul className="divide-y divide-border">
            {(data?.effective ?? []).map((h) => (
              <li
                key={h.date}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <span className="text-sm text-ink">{h.name}</span>
                  <span className="ml-2 text-xs text-ink-faint">
                    {fmtDate(h.date)}
                  </span>
                  {h.source === 'CUSTOM' && (
                    <span className="ml-2 rounded-control bg-info-subtle px-1.5 py-0.5 text-[11px] font-semibold text-info-ink">
                      Personalizado
                    </span>
                  )}
                </div>
                {h.source === 'BASE' && (
                  <Button
                    intent="ghost"
                    size="sm"
                    loading={add.isPending}
                    onClick={() => suppress(h)}
                  >
                    Suprimir
                  </Button>
                )}
              </li>
            ))}
            {(data?.effective ?? []).length === 0 && (
              <li className="py-3 text-sm text-ink-faint">
                Sem feriados neste ano.
              </li>
            )}
          </ul>
        )}
      </Card>

      {customHere.length > 0 && (
        <Card className="overflow-hidden p-4">
          <h3 className="-mx-4 -mt-4 mb-3 bg-[#0F1F3D]/60 px-4 py-3 text-sm font-semibold text-white">
            Configurados por si
          </h3>
          <ul className="divide-y divide-border">
            {customHere.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0 text-sm text-ink">
                  {c.active ? c.name : `Suprimido: ${c.name}`}
                  <span className="ml-2 text-xs text-ink-faint">
                    {fmtDate(c.date)}
                    {c.recurring ? ' · anual' : ''}
                    {c.location ? ` · ${c.location}` : ' · nacional'}
                  </span>
                </div>
                <IconButton
                  intent="ghost"
                  icon={Trash2}
                  label={`Remover ${c.name}`}
                  onClick={() => remove.mutate(c.id)}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
