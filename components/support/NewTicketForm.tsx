'use client';
// Formulário de novo pedido. Enquanto o utilizador escreve o assunto, sugere artigos da base de
// conhecimento: se resolverem o assunto, o pedido nem chega a ser aberto.

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { friendlyMessage } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { NativeSelect } from '@/components/ui/NativeSelect';
import { Textarea } from '@/components/ui/Textarea';
import {
  CATEGORY_LABEL,
  Category,
  PRIORITY_HINT,
  PRIORITY_LABEL,
  Priority,
  Ticket,
} from './types';

interface ArticleHit {
  id: number;
  title: string;
}

export function NewTicketForm({
  onCreated,
}: {
  onCreated: (t: Ticket) => void;
}) {
  const toast = useToast();
  const pathname = usePathname();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('QUESTION');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [error, setError] = useState<string | undefined>();

  const term = useDebounce(subject.trim(), 400);
  const suggestions = useApiQuery<ArticleHit[]>(
    ['knowledge', 'ticket-suggestions', term],
    '/knowledge/search',
    { params: { q: term }, enabled: term.length >= 4, meta: { silent: true } },
  );

  const create = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post<Ticket>('/support/tickets', body),
    {
      invalidateKeys: [['support', 'tickets', 'my']],
      onSuccess: (t) => {
        toast({
          title: 'Pedido enviado',
          description: 'Receberá a resposta aqui, em "Os meus pedidos".',
          intent: 'success',
        });
        onCreated(t);
      },
      onError: (e) => setError(friendlyMessage(e)),
    },
  );

  function submit() {
    if (subject.trim().length < 5) {
      setError('Escreva um assunto com pelo menos 5 caracteres.');
      return;
    }
    if (description.trim().length < 10) {
      setError(
        'Descreva o que aconteceu em pelo menos uma frase (10 caracteres).',
      );
      return;
    }
    setError(undefined);
    create.mutate({
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      page: pathname,
    });
  }

  const hits = (suggestions.data ?? []).slice(0, 3);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <FormField label="Assunto" htmlFor="ticket-subject">
        <Input
          id="ticket-subject"
          maxLength={150}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex.: Não consigo descarregar o meu certificado"
        />
      </FormField>

      {hits.length > 0 && (
        <div
          role="note"
          className="rounded-control border border-border bg-info-subtle p-3 text-sm"
        >
          <p className="font-semibold text-info-ink">Isto pode ajudar:</p>
          <ul className="mt-1 list-disc pl-5">
            {hits.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/knowledge?article=${a.id}`}
                  className="text-primary hover:underline"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tipo de assunto" htmlFor="ticket-category">
          <NativeSelect
            id="ticket-category"
            className="w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          label="Prioridade"
          htmlFor="ticket-priority"
          hint={PRIORITY_HINT[priority]}
        >
          <NativeSelect
            id="ticket-priority"
            className="w-full"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <FormField label="O que aconteceu?" htmlFor="ticket-description">
        <Textarea
          id="ticket-description"
          rows={6}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Diga o que estava a fazer, o que esperava e o que viu. Se houver uma mensagem de erro, copie-a."
        />
      </FormField>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" loading={create.isPending}>
          Enviar pedido
        </Button>
      </div>
    </form>
  );
}
