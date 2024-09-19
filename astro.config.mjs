// @ts-check
import { defineConfig, envField } from 'astro/config';
import bun from "@nurodev/astro-bun";
import alpine from '@astrojs/alpinejs';

import tailwind from '@astrojs/tailwind';

export default defineConfig({
  adapter: bun(),
  server: {
    host: import.meta.env.HOST || '0.0.0.0',
    port: import.meta.env.PORT || 4321
  },
  experimental: {
    env: {
      schema: {
        PORT: envField.number({ context: 'server', access: 'public', default: 4321 }),
        NODE_ENV: envField.string({ context: 'server', access: 'public', default: 'development' }),
        HOST: envField.string({ context: 'server', access: 'public', default: '0.0.0.0' }),
      },
    },
  },
  output: 'hybrid',
  integrations: [tailwind(),
  alpine()
  ],
});