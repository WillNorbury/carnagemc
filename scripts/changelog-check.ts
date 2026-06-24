/**
 * Production-build changelog gate.
 *
 * Validates every published changelog entry and emits release notes
 * artifacts that the app ships with the static build.
 *
 * Checks:
 *  - entry_date is a real, non-future date and within the last ~5 years
 *  - version strings parse as semver (when present) and order monotonically by date
 *  - no duplicate (title + entry_date) pairs
 *  - no duplicate version strings
 *
 * Outputs (always rewritten):
 *  - public/release-notes.json   — structured, consumed by /release-notes
 *  - public/RELEASE_NOTES.md     — human-readable mirror
 *
 * Exits with code 1 on any validation failure so `vite build` aborts.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Entry = {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string | null;
  entry_date: string; // YYYY-MM-DD
  published: boolean;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(ROOT, "public");

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? "https://xedqdxjorneezfnpyogg.supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

const BREAKING_KEYWORDS = [
  "breaking",
  "removed",
  "deprecat",
  "no longer",
  "incompatible",
  "migration required",
  "must re-",
  "must reauth",
  "rotate",
];

const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/i;

function parseSemver(v: string): [number, number, number] | null {
  const m = SEMVER_RE.exec(v.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function cmpSemver(a: [number, number, number], b: [number, number, number]) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

async function fetchEntries(): Promise<Entry[]> {
  if (!SUPABASE_ANON) throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY");
  const url =
    `${SUPABASE_URL}/rest/v1/changelog_entries` +
    `?select=id,title,content,category,version,entry_date,published` +
    `&published=eq.true&order=entry_date.desc`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as Entry[];
}

function validate(entries: Entry[]): string[] {
  const errors: string[] = [];
  const today = new Date();
  today.setUTCHours(23, 59, 59, 999);
  const floor = new Date();
  floor.setUTCFullYear(floor.getUTCFullYear() - 5);

  const seenTitleDate = new Map<string, string>();
  const seenVersion = new Map<string, string>();

  for (const e of entries) {
    // date
    const d = new Date(`${e.entry_date}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) {
      errors.push(`[${e.id}] invalid entry_date: ${e.entry_date}`);
    } else {
      if (d > today) errors.push(`[${e.id}] entry_date in future: ${e.entry_date} (${e.title})`);
      if (d < floor) errors.push(`[${e.id}] entry_date older than 5y: ${e.entry_date} (${e.title})`);
    }

    // version
    if (e.version) {
      if (!parseSemver(e.version)) {
        errors.push(`[${e.id}] version "${e.version}" is not semver (${e.title})`);
      }
      const prev = seenVersion.get(e.version);
      if (prev) errors.push(`Duplicate version "${e.version}" used by "${prev}" and "${e.title}"`);
      else seenVersion.set(e.version, e.title);
    }

    // dupes
    const key = `${e.title.trim().toLowerCase()}|${e.entry_date}`;
    const prevT = seenTitleDate.get(key);
    if (prevT) errors.push(`Duplicate entry "${e.title}" on ${e.entry_date} (also id ${prevT})`);
    else seenTitleDate.set(key, e.id);
  }

  // version order must be monotonic with date
  const versioned = entries
    .filter((e) => e.version && parseSemver(e.version!))
    .map((e) => ({ e, v: parseSemver(e.version!)!, t: e.entry_date }))
    .sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
  for (let i = 1; i < versioned.length; i++) {
    if (cmpSemver(versioned[i].v, versioned[i - 1].v) < 0) {
      errors.push(
        `Version order regression: ${versioned[i - 1].e.version} (${versioned[i - 1].t}) ` +
          `→ ${versioned[i].e.version} (${versioned[i].t})`,
      );
    }
  }

  return errors;
}

type ReleaseNote = {
  version: string | null;
  date: string;
  entries: { title: string; content: string; category: string }[];
  breaking: { title: string; content: string }[];
};

function buildReleaseNotes(entries: Entry[]): ReleaseNote[] {
  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = e.version ?? `unversioned-${e.entry_date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  const notes: ReleaseNote[] = [];
  for (const [, list] of groups) {
    list.sort((a, b) => (a.entry_date < b.entry_date ? -1 : 1));
    const head = list[list.length - 1];
    const breaking = list
      .filter((e) => {
        const hay = `${e.title} ${e.content}`.toLowerCase();
        return e.category === "security" || BREAKING_KEYWORDS.some((k) => hay.includes(k));
      })
      .map((e) => ({ title: e.title, content: e.content }));
    notes.push({
      version: head.version,
      date: head.entry_date,
      entries: list.map((e) => ({ title: e.title, content: e.content, category: e.category })),
      breaking,
    });
  }
  notes.sort((a, b) => (a.date < b.date ? 1 : -1));
  return notes;
}

function toMarkdown(notes: ReleaseNote[]): string {
  const out: string[] = ["# Release Notes", ""];
  for (const n of notes) {
    out.push(`## ${n.version ?? "Unreleased"} — ${n.date}`, "");
    if (n.breaking.length) {
      out.push("### ⚠️ Breaking changes", "");
      for (const b of n.breaking) out.push(`- **${b.title}** — ${b.content}`);
      out.push("");
    }
    out.push("### Changes", "");
    for (const e of n.entries) out.push(`- _${e.category}_ **${e.title}** — ${e.content}`);
    out.push("");
  }
  return out.join("\n");
}

export async function runChangelogCheck() {
  const entries = await fetchEntries();
  const errors = validate(entries);
  if (errors.length) {
    console.error("\n❌ Changelog validation failed:");
    for (const e of errors) console.error("  - " + e);
    throw new Error(`Changelog validation failed (${errors.length} issue(s))`);
  }

  const notes = buildReleaseNotes(entries);
  mkdirSync(PUBLIC_DIR, { recursive: true });
  writeFileSync(
    resolve(PUBLIC_DIR, "release-notes.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), notes }, null, 2),
  );
  writeFileSync(resolve(PUBLIC_DIR, "RELEASE_NOTES.md"), toMarkdown(notes));
  console.log(
    `✓ Changelog OK — ${entries.length} entries, ${notes.length} release(s), ` +
      `${notes.reduce((a, n) => a + n.breaking.length, 0)} breaking item(s).`,
  );
}

// CLI entrypoint
const isDirect = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  runChangelogCheck().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
