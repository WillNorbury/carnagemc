import { ReactNode } from "react";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const re = new RegExp(`(${escapeRegex(q)})`, "ig");
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) && part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
