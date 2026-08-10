// app/(platform)/_styleguide/page.tsx
// Referência viva de todos os primitivos de components/ui/ — mesma
// finalidade do companion visual usado no brainstorming, mas versionada
// e sempre actualizada. Serve de base para a Fase B (migração dos módulos).
// Acesso restrito: não expõe dados, mas mantém-se atrás do guard ADMIN
// tal como decidido no spec.

'use client';

import type { ReactNode } from 'react';
import { Trash2, MoreVertical } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ADMIN_ROLES, type Role } from '@/lib/roles';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { Modal, ModalTrigger, ModalContent, ModalClose } from '@/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { Tooltip } from '@/components/ui/Tooltip';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PathProgress } from '@/components/ui/PathProgress';
import { useToast } from '@/providers/ToastProvider';

export function StyleguideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[var(--space-stack)]">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export default function StyleguidePage() {
  const { data: user, isLoading } = useCurrentUser();
  const toast = useToast();

  if (isLoading) return null;

  if (!user?.role?.code || !ADMIN_ROLES.includes(user.role.code as Role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas font-body text-sm text-ink-muted">
        Acesso restrito à administração.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-[var(--space-section)] bg-canvas p-10 font-body text-ink">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Guia de estilo — INNOVA
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Referência viva dos componentes de <code>components/ui/</code>.
        </p>
      </div>
      <StyleguideSection title="Button">
        <Button>Primário</Button>
        <Button intent="secondary">Secundário</Button>
        <Button intent="ghost">Ghost</Button>
        <Button intent="danger">Eliminar</Button>
        <Button loading>A processar…</Button>
        <Button disabled>Desactivado</Button>
        <Button size="sm">Pequeno</Button>
        <IconButton icon={Trash2} label="Eliminar item" intent="ghost" />
      </StyleguideSection>
      <StyleguideSection title="Badge">
        <Badge intent="success">Concluído</Badge>
        <Badge intent="warning">Em progresso</Badge>
        <Badge intent="danger">Em atraso</Badge>
        <Badge intent="info">Novo</Badge>
        <Badge intent="neutral">Arquivado</Badge>
      </StyleguideSection>
      <StyleguideSection title="Card">
        <Card className="w-64">
          <CardHeader>
            <h3 className="font-display text-sm font-bold text-ink">Título do card</h3>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-ink-muted">Conteúdo de exemplo do corpo do card.</p>
          </CardBody>
          <CardFooter>
            <Button size="sm">Acção</Button>
          </CardFooter>
        </Card>
        <Card interactive className="w-64 p-4">
          <p className="text-sm text-ink-muted">Card interactivo (hover para ver a sombra crescer).</p>
        </Card>
      </StyleguideSection>
      <StyleguideSection title="Input / Textarea">
        <FormField label="Email" htmlFor="sg-email" hint="Usa o teu email corporativo">
          <Input id="sg-email" placeholder="nome@empresa.co.ao" className="w-64" />
        </FormField>
        <FormField label="NIF" htmlFor="sg-nif" error="NIF inválido — verifica o formato">
          <Input id="sg-nif" defaultValue="00512345" invalid className="w-64" />
        </FormField>
        <FormField label="Notas" htmlFor="sg-notes">
          <Textarea id="sg-notes" rows={3} placeholder="Escreve aqui…" className="w-64" />
        </FormField>
      </StyleguideSection>
      <StyleguideSection title="Select">
        <Select
          className="w-56"
          placeholder="Escolhe um departamento"
          items={[
            { value: 'rh', label: 'Recursos Humanos' },
            { value: 'ti', label: 'Tecnologia' },
            { value: 'fin', label: 'Financeiro' },
          ]}
        />
      </StyleguideSection>
      <StyleguideSection title="Modal">
        <Modal>
          <ModalTrigger asChild>
            <Button intent="secondary">Abrir modal</Button>
          </ModalTrigger>
          <ModalContent title="Exemplo de modal" description="Descrição de apoio ao título.">
            <div className="mt-6 flex justify-end gap-3">
              <ModalClose asChild>
                <Button intent="ghost">Cancelar</Button>
              </ModalClose>
              <ModalClose asChild>
                <Button>Confirmar</Button>
              </ModalClose>
            </div>
          </ModalContent>
        </Modal>
      </StyleguideSection>
      <StyleguideSection title="Tabs">
        <Tabs defaultValue="overview" className="w-80">
          <TabsList>
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
          <TabsContent value="details">Conteúdo dos detalhes.</TabsContent>
        </Tabs>
      </StyleguideSection>
      <StyleguideSection title="DropdownMenu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton icon={MoreVertical} label="Mais opções" intent="ghost" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger">Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </StyleguideSection>
      <StyleguideSection title="Tooltip">
        <Tooltip content="Texto de apoio">
          <Button intent="secondary">Passa o rato aqui</Button>
        </Tooltip>
      </StyleguideSection>
      <StyleguideSection title="Toast">
        <Button onClick={() => toast({ title: 'Guardado com sucesso', intent: 'success' })}>
          Disparar toast de sucesso
        </Button>
        <Button
          intent="danger"
          onClick={() =>
            toast({ title: 'Falha ao guardar', description: 'Tenta novamente.', intent: 'danger' })
          }
        >
          Disparar toast de erro
        </Button>
      </StyleguideSection>
      <StyleguideSection title="Table">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Departamento</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Ana Silva</TableCell>
              <TableCell>Recursos Humanos</TableCell>
              <TableCell><Badge intent="success">Activo</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>João Pedro</TableCell>
              <TableCell>Tecnologia</TableCell>
              <TableCell><Badge intent="neutral">Inactivo</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </StyleguideSection>
      <StyleguideSection title="Avatar">
        <Avatar name="Ana Silva" size="sm" />
        <Avatar name="João Pedro" size="md" />
        <Avatar name="Marta Costa" size="lg" />
      </StyleguideSection>
      <StyleguideSection title="ProgressBar / PathProgress">
        <ProgressBar value={64} className="w-64" />
        <PathProgress
          className="w-96"
          steps={[
            { label: 'Introdução', status: 'done' },
            { label: 'Fundamentos', status: 'done' },
            { label: 'Prática', status: 'current' },
            { label: 'Avaliação', status: 'pending' },
            { label: 'Certificado', status: 'pending' },
          ]}
        />
      </StyleguideSection>
      {/* Tasks seguintes acrescentam <StyleguideSection> aqui, por ordem */}
    </div>
  );
}
