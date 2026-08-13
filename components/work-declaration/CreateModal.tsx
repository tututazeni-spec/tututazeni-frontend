// components/work-declaration/CreateModal.tsx
// Modal de criação de declaração em 3 passos. Extraído de
// app/(platform)/work-declaration/page.tsx. Backdrop+painel bespoke
// passam a Modal/ModalContent (Radix Dialog, components/ui/Modal) —
// já traz título, botão fechar e overlay/backdrop-click de série. O
// page.tsx só monta <CreateModal> quando showCreateModal é true, por
// isso o Modal fica sempre `open`; onOpenChange chama onClose (cobre
// tanto o X como o clique fora / Escape).

'use client';

import { useState } from 'react';
import { BookOpen, Building2, Check, FileText, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { TYPE_LABELS } from './constants';
import type { DeclarationType } from './types';

interface CreateModalProps {
  onClose: () => void;
}

const TYPE_OPTIONS = [
  ['employment', 'Vínculo Empregatício', Building2],
  ['training', 'Formação / Treino', BookOpen],
  ['attendance', 'Frequência', Users],
  ['performance', 'Desempenho', TrendingUp],
  ['custom', 'Personalizada', FileText],
] as const;

const TEMPLATE_ITEMS = [
  { value: 'default', label: 'Template Padrão — Vínculo' },
  { value: 'legal', label: 'Template Formal — Jurídico' },
  { value: 'bank', label: 'Template Bancário' },
];

const LANGUAGES = ['PT', 'EN', 'FR'] as const;

export function CreateModal({ onClose }: CreateModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: '' as DeclarationType | '',
    templateId: '',
    employeeId: '',
    language: 'PT',
    purpose: '',
  });

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1800);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Nova Declaração" description={`Passo ${step} de 3`}>
        {/* Progress */}
        <div className="mt-4 h-0.5 rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="mt-5">
          {step === 1 && (
            <div className="space-y-4">
              <p className="font-body text-sm text-ink-muted">
                Selecione o tipo de declaração
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_OPTIONS.map(([val, label, Icon]) => (
                  <button
                    key={val}
                    onClick={() => setForm({ ...form, type: val })}
                    className={cn(
                      'flex flex-col items-start gap-2 rounded-card border p-4 text-left transition-all',
                      form.type === val
                        ? 'border-primary bg-primary-subtle text-primary'
                        : 'border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink',
                    )}
                  >
                    <Icon size={18} strokeWidth={1.75} />
                    <span className="font-body text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="font-body text-sm text-ink-muted">
                Dados do colaborador e template
              </p>
              <div className="space-y-3">
                <FormField label="Colaborador" htmlFor="cm-employee">
                  <Input
                    id="cm-employee"
                    placeholder="Pesquisar colaborador..."
                    className="w-full"
                  />
                </FormField>
                <FormField label="Template" htmlFor="cm-template">
                  <Select
                    items={TEMPLATE_ITEMS}
                    placeholder="Selecionar template..."
                    value={form.templateId}
                    onValueChange={(v) => setForm({ ...form, templateId: v })}
                    className="w-full"
                  />
                </FormField>
                <div>
                  <p className="mb-1.5 font-body text-xs font-medium text-ink">Idioma</p>
                  <div className="flex gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setForm({ ...form, language: lang })}
                        className={cn(
                          'rounded-control border px-4 py-2 font-body text-xs font-medium transition-all',
                          form.language === lang
                            ? 'border-primary bg-primary-subtle text-primary'
                            : 'border-border text-ink-muted hover:text-ink',
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="font-body text-sm text-ink-muted">Revisão e confirmação</p>
              <div className="divide-y divide-border rounded-card border border-border bg-surface-sunken">
                {[
                  ['Tipo', TYPE_LABELS[form.type as DeclarationType] || '—'],
                  ['Idioma', form.language],
                  ['Template', 'Template Padrão — Vínculo'],
                  ['Status inicial', 'Rascunho'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="font-body text-xs text-ink-muted">{label}</span>
                    <span className="font-body text-xs font-medium text-ink">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <Button
            intent="ghost"
            size="sm"
            onClick={() => step > 1 && setStep((s) => (s - 1) as 1 | 2 | 3)}
            className={step === 1 ? 'invisible' : ''}
          >
            Anterior
          </Button>

          {step < 3 ? (
            <Button
              size="sm"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 && !form.type}
            >
              Continuar
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} loading={loading}>
              {!loading && <Check size={14} strokeWidth={1.75} />}
              {loading ? 'A criar...' : 'Criar Declaração'}
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
