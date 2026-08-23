# Brand assets

Source artwork kept with the project but **not** deployed. Only `public/` and
the built output ship to visitors, so nothing in this folder is downloaded by
anyone browsing the site.

These files previously lived in `public/`, where they were served on every
deploy despite no page referencing them. They are here so they stay versioned
and findable without costing bandwidth.

| File | What it is |
|---|---|
| `QR_Homepage.png` | Round QR code, navy and gold, logo in the center |
| `square.png` | Square QR code with the cream logo tile inset |
| `QRcenter.png` | The logo tile that sits inside both QR codes |
| `ICON-ALONE.png` | The handshake-and-scales mark, no wordmark |

## Note on the QR codes

The destination URL encoded in these codes has **not** been verified in this
repo. Scan them with a phone before reprinting anything: if the site structure
has changed since they were generated, a code could point somewhere that no
longer exists. Regenerating a QR code is trivial; reprinting a stack of cards
is not.

Removing these files from `public/` does not affect QR codes already printed.
A QR code encodes a URL; these files are only the artwork.
