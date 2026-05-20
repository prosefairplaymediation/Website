// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://prosefairplaymediation.com',
  integrations: [
    sitemap({
      // Exclude pages that shouldn't surface in search:
      //  /              — coming-soon gate (noindex, not canonical)
      //  /thank-you     — post-payment landing, not a destination
      //  /pay/agreement — reference page opened from the pay checkbox,
      //                   not meant to be discovered via search
      filter: (page) =>
        page !== 'https://prosefairplaymediation.com/' &&
        page !== 'https://prosefairplaymediation.com/thank-you/' &&
        page !== 'https://prosefairplaymediation.com/pay/agreement/',
    }),
  ],
});
