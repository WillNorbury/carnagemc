// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs"
import { resolve } from "path"

const BASE_URL = "https://carnagemc.net"

interface SitemapEntry {
  path: string
  lastmod?: string
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: string
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/auth", changefreq: "monthly", priority: "0.3" },
  { path: "/changelog", changefreq: "weekly", priority: "0.7" },
  { path: "/dashboard", changefreq: "weekly", priority: "0.8" },
  { path: "/link-account", changefreq: "monthly", priority: "0.4" },
  { path: "/apply", changefreq: "weekly", priority: "0.6" },
  { path: "/news", changefreq: "daily", priority: "0.8" },
  { path: "/announcements", changefreq: "daily", priority: "0.8" },
  { path: "/staff", changefreq: "monthly", priority: "0.6" },
  { path: "/vote", changefreq: "weekly", priority: "0.7" },
  { path: "/community", changefreq: "weekly", priority: "0.7" },
  { path: "/rules", changefreq: "monthly", priority: "0.6" },
  { path: "/support", changefreq: "weekly", priority: "0.7" },
  { path: "/tickets", changefreq: "weekly", priority: "0.6" },
  { path: "/profile", changefreq: "monthly", priority: "0.5" },
  { path: "/users", changefreq: "weekly", priority: "0.6" },
  { path: "/discover/mods", changefreq: "daily", priority: "0.8" },
  { path: "/discover/plugins", changefreq: "daily", priority: "0.8" },
  { path: "/discover/resource-packs", changefreq: "daily", priority: "0.7" },
  { path: "/discover/data-packs", changefreq: "daily", priority: "0.7" },
  { path: "/discover/shaders", changefreq: "daily", priority: "0.7" },
  { path: "/discover/modpacks", changefreq: "daily", priority: "0.7" },
  { path: "/discover/servers", changefreq: "daily", priority: "0.7" },
  { path: "/features", changefreq: "weekly", priority: "0.7" },
  { path: "/leaderboard", changefreq: "daily", priority: "0.8" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/events", changefreq: "daily", priority: "0.8" },
  { path: "/install", changefreq: "monthly", priority: "0.6" },
  { path: "/status", changefreq: "hourly", priority: "0.9" },
  { path: "/appeal", changefreq: "monthly", priority: "0.5" },
  { path: "/unsubscribe", changefreq: "yearly", priority: "0.3" },
  { path: "/ban-appeals", changefreq: "monthly", priority: "0.5" },
  { path: "/wiki", changefreq: "weekly", priority: "0.7" },
  { path: "/gallery", changefreq: "weekly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
]

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  )

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n")
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries))
console.log(`sitemap.xml written (${entries.length} entries)`)
