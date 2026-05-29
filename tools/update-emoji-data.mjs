import fs from "node:fs/promises";
import path from "node:path";

const emojiSource = "https://unicode.org/Public/emoji/latest/emoji-test.txt";
const outputFile = path.join(process.cwd(), "assets", "emoji-data.js");

async function fetchEmojiData() {
  const response = await fetch(emojiSource);
  if (!response.ok) {
    throw new Error(`Unable to fetch emoji source: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const items = [];
  let group = "";
  let subgroup = "";

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("# group:")) {
      group = line.replace("# group:", "").trim();
      continue;
    }
    if (line.startsWith("# subgroup:")) {
      subgroup = line.replace("# subgroup:", "").trim();
      continue;
    }
    if (!line || line.startsWith("#") || !line.includes("; fully-qualified")) continue;

    const [codePart, rest = ""] = line.split("; fully-qualified");
    const afterHash = rest.split("#")[1];
    if (!afterHash) continue;

    const match = afterHash.trim().match(/^(\S+)\s+E[0-9.]+\s+(.+)$/);
    if (!match) continue;

    const codes = codePart
      .trim()
      .split(/\s+/)
      .map((code) => `U+${code.toUpperCase()}`);

    items.push({
      e: match[1],
      n: match[2].trim(),
      g: group,
      s: subgroup,
      c: codes.join(" "),
    });
  }

  return items;
}

const emoji = await fetchEmojiData();
await fs.writeFile(outputFile, `window.EMOJI_DATA = ${JSON.stringify(emoji)};\n`, "utf8");
console.log(`Updated ${emoji.length} emoji in ${outputFile}`);
