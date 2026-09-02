// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * When each page last actually changed, taken from git.
 *
 * The sitemap carried no `lastmod` at all until 2026-09-02, which meant a
 * crawler had no way to tell that a price had changed and re-crawled on its
 * own schedule instead. Google reads `lastmod` when it trusts it, and the way
 * to lose that trust is to stamp every page with the build time — a site where
 * all forty pages changed at the same instant, every deploy, is one Google
 * learns to ignore. So the date comes from the commit that last touched each
 * page's source file, which is the truth.
 *
 * Falls back to no date rather than a wrong one. A missing `lastmod` is
 * neutral; an invented one is a lie that costs the whole file its credibility.
 *
 * Note for a shallow clone (`git clone --depth 1`), which is what some CI
 * setups do: git can only report the one commit it has, so every page gets the
 * same date. That is degraded but not wrong, and Cloudflare's builds fetch
 * enough history for this to work properly.
 */
const dateCache = new Map();

function lastModified(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  const candidates = clean
    ? [`src/pages/${clean}.astro`, `src/pages/${clean}/index.astro`]
    : ['src/pages/index.astro'];

  const file = candidates.find((f) => existsSync(f));
  if (!file) return undefined;
  if (dateCache.has(file)) return dateCache.get(file);

  let iso;
  try {
    iso =
      execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim() || undefined;
  } catch {
    iso = undefined;
  }

  dateCache.set(file, iso);
  return iso;
}

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
      serialize: (item) => {
        const iso = lastModified(new URL(item.url).pathname);
        if (iso) item.lastmod = iso;
        return item;
      },
    }),
  ],
});
