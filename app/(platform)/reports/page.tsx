'use client';
// src/app/(dashboard)/reports/page.tsx
//
// A barra de separadores mantém-se um controlo manual (não o Tabs/
// TabsContent de components/ui/) porque o conteúdo não depende só do
// separador seleccionado: `activeTemplate` sobrepõe-se a qualquer
// separador quando um relatório está a ser executado (ver `active`
// abaixo, mesmo comportamento do `tab === t.id && !activeTemplate`
// original) — um padrão que TabsContent por valor não modela bem.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { InsightsTab } from '@/components/reports/InsightsTab';
import { ReportHub } from '@/components/reports/ReportHub';
import { ReportViewer } from '@/components/reports/ReportViewer';
import { SaveReportModal } from '@/components/reports/SaveReportModal';
import { SavedReportsTab } from '@/components/reports/SavedReportsTab';
import { TABS } from '@/components/reports/constants';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';
import type { Tab, Template } from '@/components/reports/types';

export default function ReportsPage() {
  const notify = useToast();
  const [tab, setTab] = useState<Tab>('hub');
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [showSave, setShowSave] = useState(false);

  const handleRun = (t: Template) => {
    setActiveTemplate(t);
  };
  const handleBack = () => setActiveTemplate(null);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <h1 className="mb-1 font-display text-xl font-bold text-ink">
              Relatórios
            </h1>
          </div>
          <Button size="sm" onClick={() => setShowSave(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Criar Relatório
          </Button>
        </div>
      </div>

      {/* Abas em formato de "cartão": cada botão é um cartão independente
          (borda + fundo branco + rounded), sem underline no container.
          Alinhadas horizontal e verticalmente (justify-center +
          items-center no wrapper, flex items-center em cada botão).
          Estado activo usa a mesma variável `active` de sempre para
          aplicar destaque azul (borda/fundo/texto primary). */}
      <div className="bg-canvas px-6 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id && !activeTemplate;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setActiveTemplate(null);
                }}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 font-body text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-white text-foreground hover:text-ink'
                }`}
              >
                <Icon size={16} strokeWidth={1.75} />
                {t.label}
              </button>
            );
          })}
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