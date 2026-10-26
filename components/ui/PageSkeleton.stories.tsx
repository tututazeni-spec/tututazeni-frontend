import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PageSkeleton } from './PageSkeleton';

const meta = {
  title: 'UI/PageSkeleton',
  component: PageSkeleton,
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'dashboard', 'table', 'cards'],
    },
  },
} satisfies Meta<typeof PageSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Dashboard: Story = { args: { variant: 'dashboard' } };
export const Table: Story = { args: { variant: 'table' } };
export const Cards: Story = { args: { variant: 'cards' } };
