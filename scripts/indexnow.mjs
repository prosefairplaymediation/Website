// Ping IndexNow with every URL in the sitemap.
//
// IndexNow is a push protocol: instead of waiting for Bing to re-crawl, the
// site tells it what changed. Bing, Yandex, Naver and Seznam share one
// endpoint, so a single POST reaches all of them. Google does not participate.
//
// Bing's index is what ChatGPT's web search leans on, so this shortens the
// path from "published" to "answerable in ChatGPT" from days to hours.
//
// Ownership is proved by hosting the key as a text file at the site root.
// public/680bede00d26f37ea47d4561099c5093.txt contains exactly the key and
// nothing else. If that file is ever removed or renamed, every submission
// starts failing silently, so this script checks it is reachable first.

import fs from "node:fs";

const KEY = "680bede00d26f37ea47d4561099c5093";
const HOST = "prosefairplaymediation.com";
const ORIGIN = `https://${HOST}`;
const KEY_URL = `${ORIGIN}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";

// Read the URLs from the built sitemap rather than a hand-kept list, so a new
// page is submitted automatically the moment it ships.
function urlsFromSitemap() {
  const files = fs
    .readdirSync("dist")
    .filter((f) => /^sitemap-\d+\.xml$/.test(f));
  if (!files.length) throw new Error("No dist/sitemap-*.xml. Run the build first.");
  const urls = [];
  for (const f of files) {
    const xml = fs.readFileSync(`dist/${f}`, "utf8");
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(m[1]);
  }
  return [...new Set(urls)];
}

// Not pages, so not in the sitemap, but engines should still be told when they
// change. llms.txt is the one that matters: it is what an assistant reads to
// describe this practice and quote its prices, so a stale copy is worse than
// no copy — it is confidently wrong, in Marie's name.
const EXTRA_URLS = [`${ORIGIN}/llms.txt`];

const urlList = [...urlsFromSitemap(), ...EXTRA_URLS];
console.log(`${urlList.length} URLs (sitemap, plus ${EXTRA_URLS.length} non-page file)`);

// Fail loudly if the key file is not actually being served. A 404 here is the
// difference between "submitted" and "silently rejected".
const keyCheck = await fetch(KEY_URL);
const keyBody = keyCheck.ok ? (await keyCheck.text()).trim() : "";
if (!keyCheck.ok || keyBody !== KEY) {
  console.error(
    `Key file check failed at ${KEY_URL}\n` +
      `  status: ${keyCheck.status}\n` +
      `  body:   ${JSON.stringify(keyBody.slice(0, 40))}\n` +
      `  want:   ${JSON.stringify(KEY)}\n` +
      `Submissions would be rejected, so nothing was sent.`
  );
  process.exit(1);
}
console.log("Key file verified.");

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_URL, urlList }),
});

// 200 accepted, 202 accepted but key still validating. Both are success.
if (res.status === 200 || res.status === 202) {
  console.log(`IndexNow accepted ${urlList.length} URLs (HTTP ${res.status}).`);
} else {
  console.error(`IndexNow returned HTTP ${res.status}: ${await res.text()}`);
  process.exit(1);
}
