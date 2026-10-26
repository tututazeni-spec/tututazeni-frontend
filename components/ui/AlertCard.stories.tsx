import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AlertCard } from './AlertCard';

const meta = {
  title: 'UI/AlertCard',
  component: AlertCard,
  parameters: { layout: 'padded' },
  args: {
    variant: 'warning',
    title: 'Falha ao gravar o registo',
    message: 'Alguns eventos não foram guardados. Tenta novamente.',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['danger', 'warning', 'info', 'success'],
    },
  },
} satisfies Meta<typeof AlertCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Warning: Story = {};
export const Danger: Story = { args: { variant: 'danger' } };
export const Info: Story = { args: { variant: 'info' } };
export const Success: Story = { args: { variant: 'success' } };
export const WithDetailAndAction: Story = {
  args: {
    detail: 'Última falha há 2 min',
    actionUrl: '/audit',
    actionLabel: 'Ver detalhes',
  },
};
