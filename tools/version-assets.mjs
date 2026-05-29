import fs from "node:fs";

const version = "20260529d";
const files = [
  "index.html",
  ...fs
    .readdirSync(".", { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(`${entry.name}/index.html`))
    .map((entry) => `${entry.name}/index.html`),
];

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/(href="(?:\.\.\/)?assets\/styles\.css)(?:\?v=[^"]*)?"/g, `$1?v=${version}"`);
  html = html.replace(/(src="(?:\.\.\/)?assets\/app\.js)(?:\?v=[^"]*)?"/g, `$1?v=${version}"`);
  html = html.replace(/(src="assets\/zh-labels\.js)(?:\?v=[^"]*)?"/g, `$1?v=${version}"`);
  fs.writeFileSync(file, html, "utf8");
  console.log(file);
}
