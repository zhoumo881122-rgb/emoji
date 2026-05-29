# VagaTools Emoji

Static multilingual emoji search and copy website for `emoji.vagatools.com`.

## Features

- Unicode emoji data generated from the official latest `emoji-test.txt`.
- Language-aware static pages for Chinese, English, Japanese, Korean, Spanish, French, German, Portuguese, Russian, Arabic and Hindi.
- Search, category browsing, one-click copy, recent emoji, favorites and Unicode code point details.
- Chinese page labels use localized emoji names under each symbol.
- SEO basics: canonical URLs, `hreflang`, Open Graph tags, JSON-LD, `robots.txt` and `sitemap.xml`.
- Google AdSense script configured with `ca-pub-9943771829287979`.

## Local preview

```bash
npx serve .
```

## Update emoji data

```bash
node tools/update-emoji-data.mjs
node tools/update-zh-labels.mjs
```

## GitHub Pages

Deploy the repository root as a static site. Point the custom domain to GitHub Pages and set the domain to:

```text
emoji.vagatools.com
```
