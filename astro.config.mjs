// @ts-check
import { defineConfig } from 'astro/config';
import bun from "@nurodev/astro-bun";
import alpine from '@astrojs/alpinejs';

import tailwind from '@astrojs/tailwind';

export default defineConfig({
  adapter: bun(),
  output: 'hybrid',
  integrations: [tailwind(),
  alpine()
  ],
});