'use client';
// src/app/(dashboard)/reports/page.tsx
//
// A barra de separadores mantém-se um controlo manual (não o Tabs/
// TabsContent de components/ui/) porque o conteúdo não depende só do
// separador seleccionado: `activeTemplate` sobrepõe-se a qualquer
// separador quando um relatório está a ser executado (ver `active`
// abaixo, mesmo comportamento do `tab === t.id && !activeTemplate`
// original) — um padrão que TabsContent por valor não modela bem.

import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';
import { useState } from 'react';
import { CircleCheck, Plus } from 'lucide-react';
import { InsightsTab } from '@/components/reports/InsightsTab';
import { ReportHub } from '@/components/reports/ReportHub';
import { ReportViewer } from '@/components/reports/ReportViewer';
import { SaveReportModal } from '@/components/reports/SaveReportModal';
import { SavedReportsTab } from '@/components/reports/SavedReportsTab';
import { TABS } from '@/components/reports/constants';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';
import type { Tab, Template } from '@/components/reports/types';

// Subtítulo mostrado por baixo do título de cada aba, indexado pelo `id`
// definido em TABS (components/reports/constants). Se algum id não estiver
// aqui, a aba mostra só o título.
const TAB_HINTS: Record<string, string> = {
  hub: 'Modelos disponíveis',
  saved: 'Relatórios guardados',
  insights: 'Análises e tendências',
};
export default function ReportsPage() {
  const notify = useToast();
  const [tab, setTab] = useState<Tab>('hub');
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [showSave, setShowSave] = useState(false);
  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];

  const handleRun = (t: Template) => {
    setActiveTemplate(t);
  };
  const handleBack = () => setActiveTemplate(null);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <ModuleBanner
          src="/images/relatórios.jpg"
          title="Relatórios"
          hint={activeTab ? TAB_HINTS[activeTab.id] : undefined}
          action={
            <Button size="sm" onClick={() => setShowSave(true)}>
              <Plus size={14} strokeWidth={1.75} />
              Criar Relatório
            </Button>
          }
        />
      </div>

      {/* Abas em "glassmorphism": contentor translúcido com desfoque
          (backdrop-blur) e botões em forma de pílula com ícone, título e
          subtítulo. A aba activa usa a mesma variável `active` de sempre
          (tab === t.id && !activeTemplate) para ganhar gradiente azul,
          sombra e um visto à direita. As manchas desfocadas atrás existem
          só para o efeito de vidro ser visível sobre o fundo claro. */}
      <div className="relative z-10 -mt-8 px-6 pb-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-16 top-0 h-40 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-40 w-72 rounded-full bg-primary/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl rounded-3xl border border-white/60 bg-white/50 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id && !activeTemplate;
              const hint = TAB_HINTS[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    setActiveTemplate(null);
                  }}
                  className={`flex items-center gap-3 whitespace-nowrap rounded-full border py-2 pl-2 pr-4 text-left font-body backdrop-blur transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    active
                      ? 'border-transparent bg-[#0F1F3D] text-white shadow-lg'
                      : 'border-white/70 bg-white/60 text-ink shadow-sm duration-200 hover:scale-105 hover:border-primary hover:bg-white/80 hover:shadow-md motion-reduce:hover:scale-100'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-white/70 text-ink/70'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold">{t.label}</span>
                    {hint && (
                      <span
                        className={`text-xs ${active ? 'opacity-85' : 'opacity-70'}`}
                      >
                        {hint}
                      </span>
                    )}
                  </span>
                  {active && (
                    <CircleCheck
                      size={16}
                      strokeWidth={2}
                      className="shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {activeTemplate ? (
          <ReportViewer template={activeTemplate} onBack={handleBack} />
        ) : tab === 'hub' ? (
          <ReportHub onRun={handleRun} />
        ) : tab === 'saved' ? (
          <SavedReportsTab
            onOpen={handleRun}
            onCreate={() => setShowSave(true)}
          />
        ) : (
          <InsightsTab />
        )}
      </div>

      {showSave && (
        <SaveReportModal
          onClose={() => setShowSave(false)}
          onSuccess={() => {
            notify({ title: 'Relatório guardado.', intent: 'success' });
            setTab('saved');
          }}
        />
      )}
    </div>
  );
}
