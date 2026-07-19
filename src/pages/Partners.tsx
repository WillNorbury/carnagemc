import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import SEO from "@/components/site/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

type Partner = {
  id: string;
  label: string;
  url: string;
  description: string | null;
  icon: string | null;
};

const Partners = () => {
  const [rows, setRows] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id,label,url,description,icon")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) toast.error(error.message);
      else setRows((data ?? []) as Partner[]);
      setLoading(false);
    })();
  }, []);

  const copyIp = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip);
      toast.success(`Copied IP: ${ip}`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <>
      <SEO
        title="Partners — CarnageMC"
        description="Our partner Minecraft servers and communities."
      />
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Partners
          </h1>
          <p className="text-muted-foreground mt-2">
            Servers and communities we team up with. Click a Minecraft IP to copy it.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No partners yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((p) => (
              <Card key={p.id} className="p-5 flex flex-col gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{p.label}</h2>
                  {p.description && (
                    <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-2 border-t">
                  <code className="text-sm font-mono truncate">{p.url}</code>
                  <Button size="sm" variant="outline" onClick={() => copyIp(p.url)}>
                    <Copy className="h-4 w-4 mr-1" /> Copy IP
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default Partners;
