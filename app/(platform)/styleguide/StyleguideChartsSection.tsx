// app/(platform)/styleguide/StyleguideChartsSection.tsx
// Referência viva dos gráficos/tabela de components/ui/charts + DataTable —
// dados fictícios, cores sempre vindas dos tokens da plataforma.

import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import { GanttChart } from '@/components/ui/charts/GanttChart';
import { DataTable } from '@/components/ui/DataTable';
import { StyleguideSection } from './StyleguideSection';

const TREND_MONTHS = ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'];

interface DemoUser {
  id: number;
  name: string;
  department: string;
  score: number;
}

const DEMO_USERS: DemoUser[] = [
  { id: 1, name: 'Ana Silva', department: 'Recursos Humanos', score: 4.6 },
  { id: 2, name: 'João Pedro', department: 'Tecnologia', score: 3.9 },
  { id: 3, name: 'Marta Costa', department: 'Financeiro', score: 4.2 },
  { id: 4, name: 'Rui Fonseca', department: 'Tecnologia', score: 2.8 },
  { id: 5, name: 'Beatriz Neto', department: 'Recursos Humanos', score: 4.9 },
];

export function StyleguideChartsSection() {
  return (
    <>
      <StyleguideSection title="AreaLineChart">
        <AreaLineChart
          className="w-[420px]"
          series={[
            {
              label: 'Novos colaboradores',
              points: TREND_MONTHS.map((m, i) => ({ x: i, y: [12, 18, 9, 24, 30, 21][i], xLabel: m })),
            },
          ]}
        />
      </StyleguideSection>

      <StyleguideSection title="BarChart">
        <BarChart
          className="w-[420px]"
          categories={['RH', 'Tecnologia', 'Financeiro', 'Operações']}
          series={[
            { label: 'Meta', values: [40, 65, 30, 50] },
            { label: 'Realizado', values: [35, 70, 28, 55] },
          ]}
        />
        <BarChart
          className="w-[320px]"
          orientation="horizontal"
          categories={['Comunicação', 'Liderança', 'Excel avançado']}
          series={[{ label: 'Colaboradores', values: [64, 41, 27] }]}
        />
      </StyleguideSection>

      <StyleguideSection title="GaugeChart">
        <GaugeChart value={82} label="Conformidade" thresholds={{ warning: 70, danger: 50 }} />
        <GaugeChart value={18} label="Rotatividade" invert thresholds={{ warning: 15, danger: 25 }} />
      </StyleguideSection>

      <StyleguideSection title="DonutChart">
        <DonutChart
          centerLabel="Colaboradores"
          data={[
            { label: 'Recursos Humanos', value: 22 },
            { label: 'Tecnologia', value: 48 },
            { label: 'Financeiro', value: 16 },
            { label: 'Operações', value: 30 },
            { label: 'Marketing', value: 9 },
          ]}
        />
      </StyleguideSection>

      <StyleguideSection title="GanttChart (etapas)">
        <GanttChart
          className="w-[560px]"
          todayValue={12}
          rows={[
            { label: 'Boas-vindas', start: 0, end: 3, status: 'done' },
            { label: 'Documentação', start: 2, end: 10, status: 'current' },
            { label: 'Formação inicial', start: 8, end: 20, status: 'pending' },
            { label: 'Avaliação 30 dias', start: 25, end: 30, status: 'overdue' },
          ]}
        />
      </StyleguideSection>

      <StyleguideSection title="DataTable">
        <DataTable
          className="w-full max-w-xl"
          columns={[
            { key: 'name', header: 'Nome', sortable: true },
            { key: 'department', header: 'Departamento', sortable: true },
            { key: 'score', header: 'Pontuação', sortable: true },
          ]}
          data={DEMO_USERS}
          rowKey={(row) => row.id}
          searchKeys={['name', 'department']}
          searchPlaceholder="Pesquisar colaborador…"
          pageSize={3}
        />
      </StyleguideSection>
    </>
  );
}
