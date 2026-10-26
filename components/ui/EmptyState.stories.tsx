import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Inbox } from 'lucide-react';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'UI/EmptyState',
  component: EmptyState,
  args: {
    icon: Inbox,
    title: 'Sem cursos inscritos',
    description: 'Quando te inscreveres num curso, ele aparece aqui.',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Panel: Story = {};
export const WithAction: Story = {
  args: { action: { label: 'Explorar cursos', onClick: () => {} } },
};
/** Para dentro de cartões e gráficos, sem caixa tracejada. */
export const Inline: Story = { args: { variant: 'inline' } };
