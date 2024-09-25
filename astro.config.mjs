import { defineConfig, envField } from 'astro/config';
import bun from "@nurodev/astro-bun";

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  adapter: bun({
    mode: "standalone",
  }),
  security: {
    checkOrigin: true
  },
  server: {
    host: import.meta.env.HOST || '0.0.0.0',
    port: import.meta.env.PORT || 4321
  },
  output: "server",
  integrations: [tailwind()],
  experimental: {
    env: {
      schema: {
        PORT: envField.number({ context: 'server', access: 'public', default: 4321 }),
        NODE_ENV: envField.string({ context: 'server', access: 'public', default: 'development' }),
        HOST: envField.string({ context: 'server', access: 'public', default: '0.0.0.0' }),
      },
    },
  },
});