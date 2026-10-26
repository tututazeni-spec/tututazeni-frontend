import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { VirtualList } from './VirtualList';

interface Row {
  id: number;
  label: string;
}
const rows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    label: `Colaborador ${i + 1}`,
  }));

const meta = {
  title: 'UI/VirtualList',
  component: VirtualList<Row>,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  args: {
    getKey: (r: Row) => r.id,
    className: 'max-h-64 rounded-card border border-border',
    renderItem: (r: Row) => (
      <div className="border-b border-border px-3 py-2 text-sm">{r.label}</div>
    ),
  },
} satisfies Meta<typeof VirtualList<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Abaixo do limiar (100) renderiza tudo, como uma lista normal. */
export const Small: Story = { args: { items: rows(20) } };
/** 6000 itens: só a janela visível está no DOM. */
export const SixThousand: Story = { args: { items: rows(6000) } };
