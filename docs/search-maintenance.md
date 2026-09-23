# Shared bilingual pages

`index.html` and `about.html` are the shared templates. Their existing `data-en`
translations are rendered into `/en/` and `/en/about.html` by
`scripts/build_english.py`, called at the end of `build_pages.py`.
The English pages use the original sections, images, styles and interactions;
do not edit generated files under `en/` directly or create separate English CSS.

For CMS-managed fields, edit the existing Chinese and English fields in
`content/index.json` through the normal content editor. For other page text,
edit the shared HTML and its `data-en` attribute. English metadata uses `data-en`
on `title` and `meta`; translated attributes use `data-en-placeholder`,
`data-en-alt`, `data-en-title` or `data-en-aria-label`.

Run `python3 build_pages.py` after editing. The CMS publisher runs this build and
includes `en/` in its commit, so both language versions ship together. News still
uses the shared `/news.json` feed and the existing translated-title fallback.
Product detail pages, news pages and the configurator retain their current URLs.

The existing language control links between matching Chinese and English URLs.
Both pages have self-referencing canonicals and reciprocal `zh-CN`, `en`, and
`x-default` alternate links. Keep the shared organization ID
`https://hboyjd.com/#organization` and preserve the Google verification token.

Before publishing, run:

```
python3 build_pages.py
python3 -m unittest discover -s tests
python3 scripts/check_seo.py
node --check main.js
```

Check desktop/mobile navigation, language controls, news, images and videos.
Changed shared JS/CSS needs a version query update in its source templates;
regenerating English propagates that version. Add new public URLs to sitemap.xml
and update lastmod only for pages that change.

Push master for automatic deployment. The webhook updates the public site and
the CMS checkout/runtime, then restarts the CMS backend. Verify both repository
revisions and the live pages. An accepted Google indexing request is not proof
of indexing or ranking; those remain separate checks.
