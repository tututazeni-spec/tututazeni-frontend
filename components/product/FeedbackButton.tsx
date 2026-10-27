'use client';
// components/product/FeedbackButton.tsx
//
// Botão "Enviar feedback" na Topbar: ideia, problema ou elogio, com a página
// actual anexada automaticamente. Uma pergunta, um campo, um botão.

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquareHeart } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { friendlyMessage } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';

type Kind = 'IDEA' | 'PROBLEM' | 'PRAISE';

const KINDS: Array<{ value: Kind; label: string }> = [
  { value: 'IDEA', label: 'Ideia' },
  { value: 'PROBLEM', label: 'Problema' },
  { value: 'PRAISE', label: 'Elogio' },
];

export function FeedbackButton() {
  const pathname = usePathname();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('IDEA');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function submit() {
    if (!comment.trim()) {
      setError('Escreva uma frase para podermos ajudar.');
      return;
    }
    setSending(true);
    setError(undefined);
    try {
      await apiClient.post('/product-experience/feedback', {
        kind,
        comment: comment.trim(),
        page: pathname,
      });
      toast({ title: 'Obrigado pelo seu feedback', intent: 'success' });
      setComment('');
      setOpen(false);
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Enviar feedback"
        title="Enviar feedback"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 44,
          minHeight: 44,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <MessageSquareHeart size={18} color="var(--color-ink-muted)" />
      </button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent
          title="Enviar feedback"
          description="Diga-nos o que correu bem ou o que podemos melhorar."
        >
          <div className="mt-4 flex flex-col gap-4">
            <div role="radiogroup" aria-label="Tipo de feedback" className="flex gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  role="radio"
                  aria-checked={kind === k.value}
                  onClick={() => setKind(k.value)}
                  className={cn(
                    'min-h-[44px] flex-1 rounded-control border-[1.5px] px-3 text-sm font-semibold',
                    kind === k.value
                      ? 'border-brand bg-brand text-white'
                      : 'border-field bg-surface text-ink',
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <FormField label="A sua mensagem" htmlFor="feedback-comment" error={error}>
              <Textarea
                id="feedback-comment"
                rows={5}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex.: gostava de exportar esta lista para Excel."
              />
            </FormField>
            <Button type="button" onClick={submit} loading={sending}>
              Enviar
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
