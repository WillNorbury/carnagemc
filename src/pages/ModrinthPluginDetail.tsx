import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, ExternalLink, ArrowLeft, Calendar } from "lucide-react";

type Project = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  icon_url: string | null;
  categories: string[];
  game_versions: string[];
  loaders: string[];
  downloads: number;
  followers: number;
  published: string;
  updated: string;
  issues_url?: string | null;
  source_url?: string | null;
  wiki_url?: string | null;
  discord_url?: string | null;
};

type VersionFile = {
  url: string;
  filename: string;
  primary: boolean;
  size: number;
};

type Version = {
  id: string;
  name: string;
  version_number: string;
  version_type: "release" | "beta" | "alpha";
  game_versions: string[];
  loaders: string[];
  date_published: string;
  downloads: number;
  files: VersionFile[];
  changelog?: string;
};

export default function ModrinthPluginDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`https://api.modrinth.com/v2/project/${projectId}`).then((r) => {
        if (!r.ok) throw new Error(`Project ${r.status}`);
        return r.json();
      }),
      fetch(`https://api.modrinth.com/v2/project/${projectId}/version`).then((r) => {
        if (!r.ok) throw new Error(`Versions ${r.status}`);
        return r.json();
      }),
    ])
      .then(([p, v]: [Project, Version[]]) => {
        if (cancelled) return;
        setProject(p);
        setVersions(v);
        setSelectedId(v[0]?.id ?? "");
        document.title = `${p.title} — Modrinth`;
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/modrinth-plugins" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="p-4 rounded-lg border border-destructive/40 text-destructive">
          {error || "Not found"}
        </div>
      </div>
    );
  }

  const selected = versions.find((v) => v.id === selectedId) ?? versions[0];
  const primaryFile = selected?.files.find((f) => f.primary) ?? selected?.files[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link
        to="/modrinth-plugins"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> All Modrinth plugins
      </Link>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {project.icon_url ? (
          <img
            src={project.icon_url}
            alt={project.title}
            className="h-24 w-24 rounded-lg object-cover bg-muted flex-shrink-0"
          />
        ) : (
          <div className="h-24 w-24 rounded-lg bg-muted flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {project.categories.map((c) => (
              <Badge key={c} variant="secondary">{c}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Download className="h-4 w-4" /> {project.downloads.toLocaleString()}
            </span>
            <a
              href={`https://modrinth.com/plugin/${project.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              View on Modrinth <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select version</label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a release" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.version_number} — {v.name} ({v.version_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge
                  variant={selected.version_type === "release" ? "default" : "secondary"}
                  className="uppercase"
                >
                  {selected.version_type}
                </Badge>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(selected.date_published).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Download className="h-3 w-3" /> {selected.downloads.toLocaleString()}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {selected.loaders.map((l) => (
                  <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                ))}
                {selected.game_versions.slice(0, 8).map((g) => (
                  <Badge key={g} variant="outline" className="text-xs">MC {g}</Badge>
                ))}
                {selected.game_versions.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{selected.game_versions.length - 8} more
                  </Badge>
                )}
              </div>

              {primaryFile && (
                <Button asChild className="w-full sm:w-auto">
                  <a href={primaryFile.url} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download {primaryFile.filename} ({(primaryFile.size / 1024 / 1024).toFixed(2)} MB)
                  </a>
                </Button>
              )}

              {selected.changelog && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">Changelog</summary>
                  <pre className="mt-2 p-3 rounded bg-muted whitespace-pre-wrap text-xs">
                    {selected.changelog}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {project.body && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">About</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-img:rounded-lg prose-a:text-primary prose-headings:scroll-mt-20">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noreferrer noopener" />
                  ),
                  img: ({ node, ...props }) => (
                    <img {...props} loading="lazy" className="rounded-lg max-w-full h-auto" />
                  ),
                }}
              >
                {project.body}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
