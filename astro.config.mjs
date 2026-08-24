// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://prosefairplaymediation.com',
  integrations: [
    sitemap({
      // Exclude pages that shouldn't surface in search:
      //  /thank-you*    — post-payment landings, not destinations. Matched by
      //                   prefix rather than listed: the four per-block pages
      //                   (/thank-you-one-hour and friends) were added after
      //                   this filter was written and named individually, so
      //                   they carried a noindex tag AND sat in the sitemap.
      //                   Search Console reports that contradiction as an
      //                   error. A prefix also covers the next one added.
      //  /pay/agreement — reference page opened from the pay checkbox,
      //                   not meant to be discovered via search
      //
      // Anything excluded here must also carry `noindex` on the page itself,
      // and vice versa. A sitemap omission alone does not deindex anything.
      filter: (page) => {
        const p = new URL(page).pathname;
        return !p.startsWith('/thank-you') && p !== '/pay/agreement/';
      },
    }),
  ],
});
