# The public page for Downthread

Two static files, no build step: [index.html](index.html) is how to use the extension and what it can
and cannot do, [privacy.html](privacy.html) is the privacy policy the Chrome Web Store submission has
to point at. They share [style.css](style.css).

## Publishing it

This repository is private, and GitHub Pages does not serve private repositories on a free
account. The site is therefore published from a separate **public** repository that contains
only these files: `grim-reaper-bit/downthread` (local copy `D:downthread-site`), served by
Pages from `main`, folder `/ (root)`. The URLs are

- `https://grim-reaper-bit.github.io/downthread/`
- `https://grim-reaper-bit.github.io/downthread/privacy.html`

The second is the one the store listing needs in its **Privacy policy URL** field.

**This folder is the source.** Edit here, then copy the files to the public repository and push
there. Never copy anything else into it: extension source, tests and backend stay private.

`.nojekyll` is here so Pages serves the files as written instead of running them through Jekyll.

## Before the store submission

- **The name is now Downthread**, so the store title carries no trademarks. Keep the platform
  names in the description, where they are descriptive rather than a claim of endorsement.
- **Publish Unlisted, not Public**, if this is for a research team: anyone with the link can install
  it, it is not indexed or browsable, and review is lighter than for a public listing.
- **Every permission needs a written justification** in the submission form. The table in
  `privacy.html` is that text, one row per permission — paste it across.
- **The data-use disclosure is NOT "no data collected".** Signing in stores an email address and a
  user id, so the submission must declare **Personally identifiable information — email address**,
  used for **app functionality** (identifying a subscription) and nothing else. Declaring "none"
  while `identity` and a database host sit in the manifest is the kind of mismatch that gets a
  listing pulled after it is live, which is worse than a rejection.
- You can still tick all three certifications truthfully: the data is not sold, not used for any
  purpose unrelated to the extension's function, and not used for creditworthiness.
