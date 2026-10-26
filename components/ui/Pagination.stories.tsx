import { useState, type ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Pagination } from './Pagination';

const meta = {
  title: 'UI/Pagination',
  component: Pagination,
  args: { page: 1, totalPages: 12, onPageChange: () => {} },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function PaginationDemo(args: ComponentProps<typeof Pagination>) {
  const [page, setPage] = useState(args.page);
  return <Pagination {...args} page={page} onPageChange={setPage} />;
}

export const Interactive: Story = {
  render: (args) => <PaginationDemo {...args} />,
};
export const Compact: Story = { args: { compact: true } };
/** Com uma só página não renderiza nada. */
export const SinglePage: Story = { args: { totalPages: 1 } };
