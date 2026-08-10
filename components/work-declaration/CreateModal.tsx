// components/work-declaration/CreateModal.tsx
// Modal de criação de declaração em 3 passos. Extraído de
// app/(platform)/work-declaration/page.tsx.

'use client';

import { useState } from 'react';
import {
  BookOpen,
  Building2,
  Check,
  FileText,
  Loader2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { TYPE_LABELS } from './constants';
import type { DeclarationType } from './types';

interface CreateModalProps {
  onClose: () => void;
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="text-base font-semibold text-white">
              Nova Declaração
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Passo {step} de 3</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="h-0.5 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Selecione o tipo de declaração
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['employment', 'Vínculo Empregatício', Building2],
                    ['training', 'Formação / Treino', BookOpen],
                    ['attendance', 'Frequência', Users],
                    ['performance', 'Desempenho', TrendingUp],
                    ['custom', 'Personalizada', FileText],
                  ] as const
                ).map(([val, label, Icon]) => (
                  <button
                    key={val}
                    onClick={() => setForm({ ...form, type: val })}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left ${
                      form.type === val
                        ? 'border-sky-500 bg-sky-900/20 text-sky-300'
                        : 'border-white/8 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Dados do colaborador e template
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">
                    Colaborador
                  </label>
                  <input
                    type="text"
                    placeholder="Pesquisar colaborador..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">
                    Template
                  </label>
                  <select className="w-full bg-[#0f1623] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/50">
                    <option value="">Selecionar template...</option>
                    <option>Template Padrão — Vínculo</option>
                    <option>Template Formal — Jurídico</option>
                    <option>Template Bancário</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">
                    Idioma
                  </label>
                  <div className="flex gap-2">
                    {['PT', 'EN', 'FR'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setForm({ ...form, language: lang })}
                        className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                          form.language === lang
                            ? 'border-sky-500 bg-sky-900/20 text-sky-300'
                            : 'border-white/8 text-slate-500 hover:text-slate-300'
                        }`}
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
              <p className="text-sm text-slate-400">Revisão e confirmação</p>
              <div className="rounded-xl bg-white/[0.03] border border-white/8 divide-y divide-white/8">
                {[
                  ['Tipo', TYPE_LABELS[form.type as DeclarationType] || '—'],
                  ['Idioma', form.language],
                  ['Template', 'Template Padrão — Vínculo'],
                  ['Status inicial', 'Rascunho'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs text-white font-medium">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/8">
          <button
            onClick={() => step > 1 && setStep((s) => (s - 1) as 1 | 2 | 3)}
            className={`px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors ${
              step === 1 ? 'invisible' : ''
            }`}
          >
            Anterior
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 && !form.type}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white transition-all disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {loading ? 'A criar...' : 'Criar Declaração'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
