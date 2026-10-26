import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Plus } from 'lucide-react';
import { Button, IconButton } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Guardar' },
  argTypes: {
    intent: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'ghost',
        'ghostDanger',
        'danger',
        'success',
        'warning',
      ],
    },
    size: { control: 'select', options: ['xs', 'sm', 'compact', 'md', 'icon'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { intent: 'secondary' } };
export const Danger: Story = {
  args: { intent: 'danger', children: 'Eliminar' },
};
/** `loading` desativa o botão e anuncia `aria-busy`. */
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };

/** Botão só de ícone: `label` é obrigatório (nome acessível). */
export const IconOnly: StoryObj<typeof IconButton> = {
  render: () => <IconButton icon={Plus} label="Adicionar" />,
};
