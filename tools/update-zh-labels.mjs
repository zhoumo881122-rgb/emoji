import fs from "node:fs/promises";
import path from "node:path";

const outputFile = path.join(process.cwd(), "assets", "zh-labels.js");
const cldrUrls = [
  "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-annotations-full/annotations/zh/annotations.json",
  "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-annotations-derived-full/annotationsDerived/zh/annotations.json",
];
const referenceUrl = "https://www.iamwawa.cn/emoji.html";

const manualLabels = {
  "❤": "爱心",
  "❤️": "爱心",
  "🧡": "橙心",
  "💛": "黄心",
  "💚": "绿心",
  "💙": "蓝心",
  "💜": "紫心",
  "🖤": "黑心",
  "🤍": "白心",
  "🤎": "棕心",
  "💔": "心碎",
  "💕": "双心",
  "💞": "旋转的心",
  "💓": "心跳",
  "💗": "成长的心",
  "💖": "闪亮的心",
  "💘": "丘比特之心",
  "💝": "礼物心",
};

function stripTags(value) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function readCldrLabels() {
  const labels = {};
  for (const url of cldrUrls) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to fetch CLDR labels: ${url}`);
    const json = await response.json();
    const annotations = json.annotations?.annotations || json.annotationsDerived?.annotations || {};
    for (const [symbol, annotation] of Object.entries(annotations)) {
      const label = annotation.tts?.[0] || annotation.default?.[0];
      if (label) labels[symbol] = label;
    }
  }
  return labels;
}

async function readReferenceLabels() {
  const labels = {};
  const response = await fetch(referenceUrl);
  if (!response.ok) throw new Error(`Unable to fetch reference labels: ${referenceUrl}`);
  const html = await response.text();
  const regex = /<li><span>(.*?)<\/span>(.*?)<\/li>/g;
  for (const match of html.matchAll(regex)) {
    const symbol = stripTags(match[1]);
    const label = stripTags(match[2]);
    if (symbol && label) labels[symbol] = label;
  }
  return labels;
}

const labels = {
  ...(await readCldrLabels()),
  ...(await readReferenceLabels()),
  ...manualLabels,
};

await fs.writeFile(outputFile, `window.ZH_EMOJI_LABELS = ${JSON.stringify(labels)};\n`, "utf8");
console.log(`Updated ${Object.keys(labels).length} Chinese emoji labels in ${outputFile}`);
