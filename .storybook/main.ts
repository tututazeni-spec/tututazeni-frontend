// .storybook/main.ts
// Catálogo vivo dos componentes de components/ui/. Corre com `npm run storybook`.
import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  stories: ['../components/ui/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/nextjs-vite',
  core: { disableTelemetry: true },
};

export default config;
