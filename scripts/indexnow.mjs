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
// no copy, it is confidently wrong, in Marie's name.
const EXTRA_URLS = [`${ORIGIN}/llms.txt`];

// Removed pages, submitted so the engines recrawl them and see the 301.
// IndexNow is explicitly for this: a submitted URL that no longer resolves to
// content is how you say "recheck this", and it is the only lever here that
// works without a Search Console session. They cannot come from the sitemap,
// because the whole point is that they are not in it any more.
//
// These can be deleted once the URLs stop appearing in results. Leaving them
// costs one line in a submission that is already twenty URLs long, so there is
// no hurry; removing them by guesswork before the engines have caught up is
// the only way to get this wrong.
const REMOVED_URLS = [
  "/process",
  "/process/how-mediation-works",
  "/process/pre-litigation-disputes",
  "/process/child-support-rules",
  "/process/alimony-rules",
  "/process/real-estate-mediation",
  "/process/is-mediation-required-before-divorce-in-florida",
  "/process/pro-se-divorce-florida",
  "/refund",
  "/cancellation",
  "/landing",
].map((p) => `${ORIGIN}${p}`);

const urlList = [...urlsFromSitemap(), ...EXTRA_URLS, ...REMOVED_URLS];
console.log(
  `${urlList.length} URLs (sitemap, plus ${EXTRA_URLS.length} non-page file ` +
    `and ${REMOVED_URLS.length} removed URLs submitted for recrawl)`
);

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
