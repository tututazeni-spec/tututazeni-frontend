import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = { args: { rows: 3 } };
export const Grid: Story = {
  args: { rows: 4, wrapperClassName: 'grid grid-cols-2 gap-3' },
};
