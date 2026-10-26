// .storybook/preview.ts
// Carrega os mesmos tokens/Tailwind da app para os componentes renderizarem igual.
import type { Preview } from '@storybook/nextjs-vite';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
  },
};

export default preview;
