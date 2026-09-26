# Shared bilingual pages

Chinese HTML is the shared template for the homepage, about page, model catalog,
seven product series, and 45 vehicle detail pages. English versions are rendered
under `/en/` with the same paths by
`scripts/build_english.py`, called at the end of `build_pages.py`.
The English pages use the original sections, images, styles and interactions;
do not edit generated files under `en/` directly. `product-i18n.css` adds language
controls and responsive spacing to the shared product layout.

For CMS-managed fields, edit the existing Chinese and English fields in
`content/index.json` through the normal content editor. For other page text,
edit the shared HTML and its `data-en` attribute. English metadata uses `data-en`
on `title` and `meta`; translated attributes use `data-en-placeholder`,
`data-en-alt`, `data-en-title` or `data-en-aria-label`.

Homepage/about translations use their existing `data-en` attributes. Product
translations live in `content/product-translations.json`, keyed by Chinese text
with normalized whitespace. Add an English translation whenever changing product
copy; the build fails on untranslated text. Keep model codes, numeric parameters,
photos, and the registered ICP identifier intact. Product JSON-LD is translated
from the same dictionary. The public mobile number displays as `86-13396121288`
and its dialing link is `tel:+8613396121288`.

Run `python3 build_pages.py` after editing. The CMS publisher runs this build and
includes `en/` in its commit, so both language versions ship together. News still
uses the shared `/news.json` feed and the existing translated-title fallback.
English catalog, category, and vehicle links stay in English. News and the
configurator keep their existing shared URLs; quote links preserve the selected
model and its query parameters.

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
