# Search and language pages

The Chinese homepage `/` and company page `/about.html` link to the static
English pages `/en/` and `/en/about.html`. Each page has a self-referencing
canonical and reciprocal `zh-CN`, `en`, and `x-default` alternate links.
The English pages render their content without JavaScript.

English content is maintained directly in `en/index.html` and `en/about.html`.
The current CMS builds only the Chinese pages; it does not translate or overwrite
the English pages. When changing company facts, products or contact details,
update both languages and review the English text. Use the official English
name **Hubei Ouyang Jude Automobile Co., Ltd.** and shared organization ID
`https://hboyjd.com/#organization`. Do not invent certifications or aliases.

Before publishing, run `python3 scripts/check_seo.py`, check desktop/mobile
navigation, and preserve the existing Google verification token. Add new public
URLs to `sitemap.xml`; update `lastmod` only when the corresponding page changes.
English CSS changes require a new version query in both English HTML files.

Deployment: push `master`, then verify the production commit and public pages.
Submit the updated sitemap in Google Search Console and request indexing of new
or materially changed pages. An accepted indexing request is not proof of
indexing or of ranking for a particular query. Check those separately.
