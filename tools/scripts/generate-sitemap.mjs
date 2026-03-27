import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const catalogPath = path.join(projectRoot, "src", "utils", "toolCatalog.tsx");
const publicDir = path.join(projectRoot, "public");

const rawSiteUrl = process.env.SITE_URL || "https://yiqishuyuan.online";
const siteUrl = rawSiteUrl.replace(/\/+$/, "");

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getToolPaths(catalogSource) {
  const baseMatch = catalogSource.match(/const BASE = ['"`]([^'"`]+)['"`]/);
  const basePath = baseMatch ? baseMatch[1] : "/tools";

  const idMatches = catalogSource.matchAll(
    /createTool\(\s*'[^']+'\s*,\s*'([^']+)'/g,
  );

  const uniqueIds = new Set();
  for (const match of idMatches) {
    uniqueIds.add(match[1]);
  }

  const staticPages = ["/about", "/contact", "/privacy-policy", "/terms"];
  return ["/", ...staticPages, ...Array.from(uniqueIds, (id) => `${basePath}/${id}`)];
}

function buildSitemap(urls) {
  const now = new Date().toISOString();
  const body = urls
    .map(
      (urlPath) => `  <url>
    <loc>${escapeXml(`${siteUrl}${urlPath}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${urlPath === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function buildRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}

async function main() {
  const catalogSource = await readFile(catalogPath, "utf8");
  const toolPaths = getToolPaths(catalogSource);
  const sitemap = buildSitemap(toolPaths);
  const robots = buildRobotsTxt();

  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, "sitemap.xml"), sitemap, "utf8");
  await writeFile(path.join(publicDir, "robots.txt"), robots, "utf8");

  console.log(
    `Generated sitemap.xml and robots.txt for ${toolPaths.length} routes.`,
  );
}

main().catch((error) => {
  console.error("Failed to generate sitemap:", error);
  process.exitCode = 1;
});
