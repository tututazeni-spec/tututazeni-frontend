// Auditoria automática de acessibilidade (axe-core) dos primitivos de
// components/ui/. Apanha rótulos em falta, papéis ARIA inválidos, nomes
// acessíveis vazios, etc. Não substitui teste manual com teclado/leitor de ecrã.
import { render } from '@testing-library/react';
// Caminho completo: os tipos do vitest-axe 0.1 não resolvem a partir da raiz do pacote.
import { axe } from 'vitest-axe/dist/index.js';
import { describe, expect, it } from 'vitest';
import { Inbox, Plus } from 'lucide-react';
import { AlertCard } from './AlertCard';
import { Badge } from './Badge';
import { Button, IconButton } from './Button';
import { Combobox } from './Combobox';
import { ConfirmDialog } from './ConfirmDialog';
import { DataTable } from './DataTable';
import { EmptyState } from './EmptyState';
import { FormField } from './FormField';
import { Input } from './Input';
import { Modal, ModalContent } from './Modal';
import { PageSkeleton } from './PageSkeleton';
import { Pagination } from './Pagination';
import { Skeleton } from './Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

async function expectNoViolations(ui: React.ReactElement) {
  const { container, baseElement } = render(ui);
  // Modais montam num Portal, fora do container.
  expect(
    await axe(baseElement ?? container, {
      // `region` é regra de página inteira, não de componente isolado.
      rules: {
        region: { enabled: false },
        // jsdom não tem canvas: o axe não consegue calcular contraste aqui.
        'color-contrast': { enabled: false },
      },
    }),
  ).toHaveNoViolations();
}

describe('acessibilidade dos primitivos de UI', () => {
  it('Button e IconButton', () =>
    expectNoViolations(
      <div>
        <Button>Guardar</Button>
        <Button loading>A guardar</Button>
        <Button disabled>Indisponível</Button>
        <IconButton icon={Plus} label="Adicionar" />
      </div>,
    ));

  it('FormField + Input (com erro)', () =>
    expectNoViolations(
      <FormField label="Email" htmlFor="email" error="Email inválido">
        <Input id="email" invalid />
      </FormField>,
    ));

  it('EmptyState (panel e inline)', () =>
    expectNoViolations(
      <div>
        <EmptyState icon={Inbox} title="Sem dados" description="Nada aqui" />
        <EmptyState variant="inline" title="Vazio" />
      </div>,
    ));

  it('AlertCard', () =>
    expectNoViolations(
      <AlertCard
        variant="danger"
        title="Falha ao gravar"
        message="Tenta novamente."
      />,
    ));

  it('Badge e Skeleton', () =>
    expectNoViolations(
      <div>
        <Badge intent="success">Ativo</Badge>
        <Skeleton rows={2} />
      </div>,
    ));

  it('PageSkeleton (todas as variantes)', () =>
    expectNoViolations(
      <div>
        <PageSkeleton />
        <PageSkeleton variant="dashboard" />
        <PageSkeleton variant="table" />
        <PageSkeleton variant="cards" />
      </div>,
    ));

  it('Pagination', () =>
    expectNoViolations(
      <Pagination page={2} totalPages={8} onPageChange={() => {}} />,
    ));

  it('Tabs', () =>
    expectNoViolations(
      <Tabs defaultValue="a">
        <TabsList aria-label="Secções">
          <TabsTrigger value="a">Geral</TabsTrigger>
          <TabsTrigger value="b">Detalhes</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Conteúdo A</TabsContent>
        <TabsContent value="b">Conteúdo B</TabsContent>
      </Tabs>,
    ));

  it('Combobox', () =>
    expectNoViolations(
      <Combobox
        label="País"
        items={[
          { value: 'pt', label: 'Portugal' },
          { value: 'ao', label: 'Angola' },
        ]}
      />,
    ));

  it('Modal', () =>
    expectNoViolations(
      <Modal open>
        <ModalContent title="Título" description="Descrição">
          Corpo
        </ModalContent>
      </Modal>,
    ));

  it('ConfirmDialog', () =>
    expectNoViolations(
      <ConfirmDialog
        title="Eliminar?"
        message="Não pode ser desfeito."
        destructive
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    ));

  it('DataTable com dados e vazia', async () => {
    interface Row {
      id: number;
      nome: string;
    }
    const columns = [{ key: 'nome', header: 'Nome', sortable: true }];
    await expectNoViolations(
      <DataTable<Row>
        columns={columns}
        data={[{ id: 1, nome: 'Ana' }]}
        rowKey={(r) => r.id}
      />,
    );
    await expectNoViolations(
      <DataTable<Row>
        columns={columns}
        data={[]}
        rowKey={(r) => r.id}
        emptyLabel="Sem registos"
      />,
    );
  });
});
