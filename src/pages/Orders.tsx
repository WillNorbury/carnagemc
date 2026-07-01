import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { useCart, type CartItem } from "@/lib/cart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  Package,
  Receipt,
} from "lucide-react";

const detailBase: Record<string, string> = {
  resource_pack: "/resource-pack",
  data_pack: "/data-pack",
  shader: "/shader",
  modpack: "/modpack",
  server: "/server",
  skript: "/skript",
};

const formatDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const DownloadButton = ({ item }: { item: CartItem }) => {
  const [busy, setBusy] = useState(false);
  const onDownload = async () => {
    if (item.storage_path) {
      setBusy(true);
      const { data, error } = await supabase.storage
        .from("skripts")
        .createSignedUrl(item.storage_path, 60, {
          download: item.file_name || `${item.slug ?? "download"}.sk`,
        });
      setBusy(false);
      if (error || !data?.signedUrl) {
        toast.error("Could not generate download link");
        return;
      }
      window.location.href = data.signedUrl;
      return;
    }
    if (item.external_url) {
      window.open(item.external_url, "_blank", "noopener,noreferrer");
      return;
    }
    toast.error("No download available for this item");
  };

  if (!item.storage_path && !item.external_url) {
    return (
      <Button size="sm" variant="ghost" disabled>
        No file
      </Button>
    );
  }

  return (
    <Button size="sm" variant="secondary" onClick={onDownload} disabled={busy}>
      {item.storage_path ? (
        <><Download className="h-4 w-4 mr-1" /> Download</>
      ) : (
        <><ExternalLink className="h-4 w-4 mr-1" /> Open</>
      )}
    </Button>
  );
};

const Orders = () => {
  const { orders } = useCart();
  const [params] = useSearchParams();
  const placedId = params.get("placed");

  useEffect(() => {
    document.title = "Order history";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16 max-w-4xl">
        <h1 className="font-display font-bold text-3xl flex items-center gap-2 mb-6">
          <Receipt className="h-7 w-7" /> Order history
        </h1>

        {placedId && (
          <Card className="p-4 mb-6 border-primary/40 bg-primary/5 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-medium">Order placed!</p>
              <p className="text-muted-foreground">
                Your purchases are unlocked below.
              </p>
            </div>
          </Card>
        )}

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No orders yet.</p>
            <Button asChild>
              <Link to="/plugins">
                Browse skripts <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-5">
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <Badge variant="secondary">
                    Total: ${order.total.toFixed(2)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3"
                    >
                      {it.icon_url ? (
                        <img src={it.icon_url} alt="" className="h-10 w-10 rounded object-cover border border-border" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`${detailBase[it.kind] ?? "#"}/${it.slug ?? it.id}`}
                          className="font-medium hover:text-primary truncate block"
                        >
                          {it.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {it.price > 0 ? `$${it.price.toFixed(2)}` : "Free"}
                          {it.author ? ` · by ${it.author}` : ""}
                        </p>
                      </div>
                      <DownloadButton item={it} />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
