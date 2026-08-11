'use client';
// app/(platform)/engagement/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/engagement/ (mesmo padrão que components/payslips/page.tsx
// usa para ListView/CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import {
  Activity,
  Award,
  BarChart2,
  MessageSquare,
  Plus,
  RefreshCw,
  Smile,
} from 'lucide-react';
import { AnalyticsTab } from '@/components/engagement/AnalyticsTab';
import { FeedbackTab } from '@/components/engagement/FeedbackTab';
import { OverviewTab } from '@/components/engagement/OverviewTab';
import { RecognitionTab } from '@/components/engagement/RecognitionTab';
import { SurveysTab } from '@/components/engagement/SurveysTab';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: Smile },
  { id: 'surveys', label: 'Surveys', icon: BarChart2 },
  { id: 'recognition', label: 'Reconhecimento', icon: Award },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: Activity },
] as const;

export default function EngagementPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-control bg-primary-subtle p-1.5">
                <Smile size={18} strokeWidth={1.75} className="text-primary" />
              </div>
              <h1 className="font-display text-xl font-bold text-ink">Engagement</h1>
            </div>
            <p className="font-body text-sm text-ink-faint">
              Surveys · Reconhecimento · Feedback · Mood · Analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Button intent="secondary" size="sm">
              <RefreshCw size={14} strokeWidth={1.75} />
              Actualizar
            </Button>
            <Button size="sm">
              <Plus size={14} strokeWidth={1.75} />
              Novo Survey
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.id} value={t.id} className="gap-2 whitespace-nowrap">
                  <Icon size={16} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="surveys">
            <SurveysTab />
          </TabsContent>
          <TabsContent value="recognition">
            <RecognitionTab />
          </TabsContent>
          <TabsContent value="feedback">
            <FeedbackTab />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
