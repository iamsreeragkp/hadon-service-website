#!/usr/bin/env node
/*
 * Tiny static-site builder. No dependencies.
 *
 *   node build.js          build src/ into dist/
 *   node build.js serve    build, then serve dist/ at http://localhost:8080
 *
 * Pages live in src/pages/*.html and start with front matter comments:
 *   <!-- title: Page title -->
 *   <!-- description: Meta description -->
 *   <!-- nav: work -->            (optional; highlights that nav item)
 *
 * Anywhere in a page or partial, <!-- @include name --> pulls in
 * src/partials/name.html.
 *
 * Temporarily hide content without deleting it by wrapping it in
 *   <!-- @hide-start --> ... <!-- @hide-end -->
 * The block is left out of the built site. Remove the two markers to restore it.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src");
const OUT = path.join(__dirname, "dist");
const SITE_URL = "https://hadonlabs.com";

const read = (p) => fs.readFileSync(p, "utf8");

const HIDDEN = /<!--\s*@hide-start\s*-->[\s\S]*?<!--\s*@hide-end\s*-->\n?/g;

function include(html, depth = 0) {
  if (depth > 10) throw new Error("Include depth exceeded — check for a partial including itself.");
  html = html.replace(HIDDEN, "");
  return html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) => {
    const file = path.join(SRC, "partials", `${name}.html`);
    if (!fs.existsSync(file)) throw new Error(`Missing partial: ${name}`);
    return include(read(file), depth + 1);
  });
}

function frontMatter(html) {
  const meta = {};
  const body = html.replace(/^\s*(?:<!--\s*(\w+):\s*([\s\S]*?)\s*-->\s*)+/, (block) => {
    for (const [, key, value] of block.matchAll(/<!--\s*(\w+):\s*([\s\S]*?)\s*-->/g)) meta[key] = value;
    return "";
  });
  return { meta, body };
}

function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.cpSync(path.join(SRC, "assets"), path.join(OUT, "assets"), { recursive: true });

  const layout = read(path.join(SRC, "layout.html"));
  const pages = fs.readdirSync(path.join(SRC, "pages")).filter((f) => f.endsWith(".html"));

  for (const file of pages) {
    const { meta, body } = frontMatter(read(path.join(SRC, "pages", file)));
    const slug = file === "index.html" ? "" : file.replace(/\.html$/, "");
    let html = include(layout)
      .replace("{{content}}", () => include(body))
      .replaceAll("{{title}}", meta.title || "Hadon for business")
      .replaceAll("{{description}}", meta.description || "")
      .replaceAll("{{url}}", `${SITE_URL}/${slug}`);

    if (meta.nav) {
      html = html.replace(new RegExp(`data-nav="${meta.nav}"`, "g"), `data-nav="${meta.nav}" aria-current="page"`);
    }
    fs.writeFileSync(path.join(OUT, file), html);
  }
  console.log(`Built ${pages.length} pages into dist/`);
}

function serve(port = 8080) {
  const http = require("http");
  const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };
  http
    .createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0]);
      if (p.endsWith("/")) p += "index.html";
      let file = path.join(OUT, path.normalize(p));
      if (!file.startsWith(OUT)) return res.writeHead(403).end();
      if (!path.extname(file) && fs.existsSync(file + ".html")) file += ".html";
      fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
        res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" }).end(data);
      });
    })
    .listen(port, () => console.log(`Serving dist/ at http://localhost:${port}`));
}

build();
if (process.argv[2] === "serve") serve();
