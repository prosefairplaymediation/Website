// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://prosefairplaymediation.com',
  integrations: [
    sitemap({
      // Exclude the coming-soon gate at "/" from the sitemap — it's
      // noindex and not a canonical destination.
      filter: (page) => page !== 'https://prosefairplaymediation.com/',
    }),
  ],
});
