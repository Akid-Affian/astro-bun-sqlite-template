// @ts-check
import { defineConfig } from 'astro/config';
import bun from "@nurodev/astro-bun";

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  adapter: bun(),
  output: "hybrid",
  integrations: [tailwind()]
});