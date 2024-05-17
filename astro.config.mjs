import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";
import markdownConfig from './markdown.config'

// https://astro.build/config
export default defineConfig({
  site: 'https://www.felkru.com',
  integrations: [
    mdx({
      ...markdownConfig,
      extendPlugins: false,
    }),
    sitemap(),
    tailwind()
  ],
  markdown: markdownConfig,
});