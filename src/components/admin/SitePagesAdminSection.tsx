import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";

type Section = { id: string; heading: string; body: string[] };

type PageRow = {
  id: string;
  slug: string;
  title: string;
  highlight: string;
  eyebrow: string;
  intro: string;
  seo_description: string;
  icon: string;
  updated_label: string;
  sections: Section[];
  published: boolean;
  sort_order: number;
};

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const SitePagesAdminSection = () => {
  const [rows, setRows] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_pages")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else
      setRows(
        (data ?? []).map((r) => ({
          ...(r as unknown as PageRow),
          sections: Array.isArray(r.sections) ? (r.sections as unknown as Section[]) : [],
        })),
      );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = (id: string, patch: Partial<PageRow>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const updateSection = (id: string, index: number, patch: Partial<Section>) =>
    setRows((r) =>
      r.map((x) =>
        x.id === id
          ? { ...x, sections: x.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)) }
          : x,
      ),
    );

  const save = async (row: PageRow) => {
    setSaving(row.id);
    const { error } = await supabase
      .from("site_pages")
      .update({
        slug: slugify(row.slug),
        title: row.title,
        highlight: row.highlight,
        eyebrow: row.eyebrow,
        intro: row.intro,
        seo_description: row.seo_description,
        icon: row.icon,
        updated_label: row.updated_label,
        sections: row.sections as unknown as never,
        published: row.published,
        sort_order: row.sort_order,
      })
      .eq("id", row.id);
    setSaving(null);
    if (error) toast.error(error.message);
    else toast.success("Page saved");
  };

  const create = async () => {
    const slug = slugify(newSlug);
    if (!slug) return toast.error("Enter a URL slug first");
    const { error } = await supabase.from("site_pages").insert({
      slug,
      title: slug.replace(/-/g, " "),
      highlight: "",
      intro: "",
      seo_description: "",
      sections: [] as unknown as never,
      sort_order: (rows.at(-1)?.sort_order ?? 0) + 10,
    });
    if (error) return toast.error(error.message);
    setNewSlug("");
    toast.success("Page created");
    load();
  };

  const remove = async (row: PageRow) => {
    if (!(await confirm({ title: `Delete /${row.slug}?`, description: "This cannot be undone." }))) return;
    const { error } = await supabase.from("site_pages").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Page deleted");
    load();
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-10">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading pages…
      </div>
    );

  return (
    <div className="space-y-6">
      <Card className="p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 space-y-1">
          <Label>New page URL slug</Label>
          <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="e.g. seasons" />
        </div>
        <Button onClick={create}>
          <Plus className="h-4 w-4 mr-1" /> Create page
        </Button>
      </Card>

      <Accordion type="multiple" className="space-y-3">
        {rows.map((row) => (
          <AccordionItem key={row.id} value={row.id} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-3 text-left">
                <span className="font-semibold">{row.title} {row.highlight}</span>
                <span className="text-xs text-muted-foreground">/{row.slug}</span>
                {!row.published && <span className="text-xs text-destructive">draft</span>}
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-6">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>URL slug</Label>
                  <Input value={row.slug} onChange={(e) => update(row.id, { slug: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Eyebrow label</Label>
                  <Input value={row.eyebrow} onChange={(e) => update(row.id, { eyebrow: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={row.title} onChange={(e) => update(row.id, { title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Highlighted word</Label>
                  <Input value={row.highlight} onChange={(e) => update(row.id, { highlight: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Icon (lucide name)</Label>
                  <Input value={row.icon} onChange={(e) => update(row.id, { icon: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Last updated label</Label>
                  <Input
                    value={row.updated_label}
                    onChange={(e) => update(row.id, { updated_label: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Intro</Label>
                <Textarea value={row.intro} onChange={(e) => update(row.id, { intro: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>SEO description</Label>
                <Textarea
                  value={row.seo_description}
                  onChange={(e) => update(row.id, { seo_description: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Sections</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      update(row.id, {
                        sections: [
                          ...row.sections,
                          { id: `section-${row.sections.length + 1}`, heading: "New section", body: [""] },
                        ],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add section
                  </Button>
                </div>
                {row.sections.map((s, i) => (
                  <Card key={i} className="p-3 space-y-2">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Anchor id</Label>
                        <Input value={s.id} onChange={(e) => updateSection(row.id, i, { id: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Heading</Label>
                        <Input
                          value={s.heading}
                          onChange={(e) => updateSection(row.id, i, { heading: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Paragraphs (one per line)</Label>
                      <Textarea
                        rows={4}
                        value={(s.body ?? []).join("\n")}
                        onChange={(e) =>
                          updateSection(row.id, i, {
                            body: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                          })
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() =>
                        update(row.id, { sections: row.sections.filter((_, j) => j !== i) })
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove section
                    </Button>
                  </Card>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={row.published}
                    onCheckedChange={(v) => update(row.id, { published: v })}
                  />
                  <Label>Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Order</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={row.sort_order}
                    onChange={(e) => update(row.id, { sort_order: Number(e.target.value) || 0 })}
                  />
                </div>
                <Button onClick={() => save(row)} disabled={saving === row.id}>
                  {saving === row.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/${row.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" /> View
                  </a>
                </Button>
                <Button variant="ghost" className="text-destructive" onClick={() => remove(row)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default SitePagesAdminSection;
