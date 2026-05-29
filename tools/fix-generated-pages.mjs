import fs from "node:fs";

const siteUrl = "https://emoji.vagatools.com";
const languages = [
  ["zh-CN", ".", "简体中文"],
  ["en", "en", "English"],
  ["ja", "ja", "日本語"],
  ["ko", "ko", "한국어"],
  ["es", "es", "Español"],
  ["fr", "fr", "Français"],
  ["de", "de", "Deutsch"],
  ["pt", "pt", "Português"],
  ["ru", "ru", "Русский"],
  ["ar", "ar", "العربية"],
  ["hi", "hi", "हिन्दी"],
];

const href = (dir) => `${siteUrl}/${dir === "." ? "" : `${dir}/`}`;
const alternateLinks = `${languages
  .map(([code, dir]) => `<link rel="alternate" hreflang="${code.toLowerCase()}" href="${href(dir)}">`)
  .join("\n  ")}
  <link rel="alternate" hreflang="x-default" href="${siteUrl}/">`;
const siteLanguages = `window.SITE_LANGUAGES = ${JSON.stringify(
  languages.map(([code, dir, label]) => ({ code, dir, label })),
)};`;
const inLanguage = `"inLanguage":${JSON.stringify(languages.map(([code]) => code))}`;

for (const [code, dir] of languages) {
  const file = dir === "." ? "index.html" : `${dir}/index.html`;
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/<html lang="[^"]+" dir="[^"]+"/, `<html lang="${code}" dir="${code === "ar" ? "rtl" : "ltr"}"`);
  html = html.replace(/<body data-lang="[^"]+"/, `<body data-lang="${code}"`);
  html = html.replace(
    /<link rel="alternate" hreflang="[^"]+" href="https:\/\/emoji\.vagatools\.com\/[^"]*">(?:\r?\n  <link rel="alternate" hreflang="[^"]+" href="https:\/\/emoji\.vagatools\.com\/[^"]*">)*/m,
    alternateLinks,
  );
  html = html.replace(/"inLanguage":\[[^\]]*\]/, inLanguage);
  html = html.replace(/window\.SITE_LANGUAGES = .*?;/, siteLanguages);
  fs.writeFileSync(file, html, "utf8");
}

console.log(`Fixed ${languages.length} generated pages.`);
