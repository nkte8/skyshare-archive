import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import partytown from '@astrojs/partytown';
import ts from 'rollup-plugin-typescript2';

// https://astro.build/config
/** @type {import('tailwindcss').Config} */
export default defineConfig({
  base: "/",
  site: "https://skyshare.uk/",
  server: {
    port: 4321,
    host: true
  },
  integrations: [
    react(),
    tailwind(),
    partytown()
  ],
  output: "hybrid",
  adapter: cloudflare(),
  vite: {
    build: {
      rollupOptions: {
        plugins: [ts({ transformers: [() => cjsToEsm()] })],
      },
    },
  },
});