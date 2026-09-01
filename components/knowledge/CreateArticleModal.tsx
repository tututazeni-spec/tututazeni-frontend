// components/knowledge/CreateArticleModal.tsx
// Modal "Novo artigo" do cabeçalho da Base de Conhecimento. Segue o padrão de
// components/content-library/AddContentModal — a page só monta o componente
// quando está aberto, por isso o Modal fica sempre `open` e `onOpenChange`
// delega em `onClose` (X, clique fora, Escape).
//
// Submete em POST /knowledge. O endpoint não tem @Roles no backend
// (knowledge.controller.ts) — qualquer utilizador autenticado pode criar; o
// artigo nasce em DRAFT e precisa de publicação à parte (dashboard Admin).
// DTO: CreateKnowledgeArticleDto — title/content obrigatórios; summary,
// categoryId, tags[], accessLevel e mandatory opcionais.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/ToastProvider';
import type { Category } from './types';

export interface CreateArticleModalProps {
  onClose: () => void;
}

const NO_CATEGORY = 'NONE';

// value = enum Prisma ArticleAccess, validado por @IsEnum no backend — nunca
// traduzir. DEPARTMENT/ROLE exigem campos extra (restrictedDepartmentId, etc.)
// que ficam fora do âmbito deste formulário enxuto.
const ACCESS_ITEMS = [
  { value: 'PUBLIC', label: 'Público' },
  { value: 'CONFIDENTIAL', label: 'Confidencial' },
];

export function CreateArticleModal({ onClose }: CreateArticleModalProps) {
  const notify = useToast();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(NO_CATEGORY);
  const [accessLevel, setAccessLevel] = useState('PUBLIC');
  const [tagsRaw, setTagsRaw] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data: categories } = useApiQuery<Category[]>(
    queryKeys.knowledge.categories(),
    '/knowledge/categories',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  // Achata um nível de subcategorias para o Select.
  const categoryItems = [
    { value: NO_CATEGORY, label: 'Sem categoria' },
    ...(categories ?? []).flatMap((c) => [
      { value: String(c.id), label: c.name },
      ...(c.children ?? []).map((child) => ({
        value: String(child.id),
        label: `— ${child.name}`,
      })),
    ]),
  ];

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const createArticle = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post('/knowledge', body),
    {
      invalidateKeys: [queryKeys.knowledge.all],
      onSuccess: () => {
        notify({
          title: 'Artigo criado',
          description: 'Fica em rascunho até ser publicado.',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setSubmitError(e.message || 'Erro ao criar o artigo. Tente novamente.'),
    },
  );
  const loading = createArticle.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    createArticle.mutate({
      title: title.trim(),
      content: content.trim(),
      accessLevel,
      ...(summary.trim() ? { summary: summary.trim() } : {}),
      ...(categoryId !== NO_CATEGORY ? { categoryId: Number(categoryId) } : {}),
      ...(tags.length ? { tags } : {}),
      ...(mandatory ? { mandatory: true } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo artigo"
        description="Cria um artigo na base de conhecimento. Fica em rascunho até ser publicado."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Título *" htmlFor="ka-title">
            <Input
              id="ka-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Política de Férias — Angola 2026"
              maxLength={300}
            />
          </FormField>

          <FormField label="Resumo" htmlFor="ka-summary">
            <Textarea
              id="ka-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Opcional — uma ou duas frases sobre o artigo."
              rows={2}
              maxLength={500}
              className="w-full"
            />
          </FormField>

          <FormField
            label="Conteúdo *"
            htmlFor="ka-content"
            hint="Aceita Markdown ou HTML."
          >
            <Textarea
              id="ka-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreve o conteúdo do artigo…"
              rows={8}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Categoria" htmlFor="ka-category">
              <Select
                items={categoryItems}
                value={categoryId}
                onValueChange={setCategoryId}
                className="w-full"
              />
            </FormField>

            <FormField label="Nível de acesso" htmlFor="ka-access">
              <Select
                items={ACCESS_ITEMS}
                value={accessLevel}
                onValueChange={setAccessLevel}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField
            label="Tags"
            htmlFor="ka-tags"
            hint="Separadas por vírgula."
          >
            <Input
              id="ka-tags"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="férias, rh, políticas"
            />
          </FormField>

          <button
            type="button"
            aria-pressed={mandatory}
            onClick={() => setMandatory((v) => !v)}
            className={cn(
              'rounded-control border px-3 py-1.5 font-body text-xs transition-colors',
              mandatory
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-border-strong bg-surface text-ink-muted',
            )}
          >
            Leitura obrigatória
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            Criar artigo
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
