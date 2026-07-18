import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Package, ArrowRight, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Ticket = {
  id: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
};

const statusMeta: Record<string, { label: string; className: string; Icon: any }> = {
  open: { label: "Pending", className: "text-yellow-300 border-yellow-500/40 bg-yellow-500/5", Icon: Clock },
  pending: { label: "Pending", className: "text-yellow-300 border-yellow-500/40 bg-yellow-500/5", Icon: Clock },
  in_progress: { label: "Processing", className: "text-blue-300 border-blue-500/40 bg-blue-500/5", Icon: Loader2 },
  resolved: { label: "Fulfilled", className: "text-green-300 border-green-500/40 bg-green-500/5", Icon: CheckCircle2 },
  closed: { label: "Closed", className: "text-slate-300 border-white/20 bg-white/5", Icon: CheckCircle2 },
  cancelled: { label: "Cancelled", className: "text-red-300 border-red-500/40 bg-red-500/5", Icon: XCircle },
};

export default function MeOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("id, subject, body, status, created_at")
        .eq("user_id", user.id)
        .eq("category", "Store & Payments")
        .order("created_at", { ascending: false });
      setOrders((data as Ticket[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-slate-100">
      <Helmet>
        <title>My Orders — CarnageMC</title>
        <meta name="description" content="View your CarnageMC store order history and fulfillment status." />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap" rel="stylesheet" />
      </Helmet>
      <Navbar />
      <main className="flex-1 w-full font-['Inter']">
        <div className="max-w-5xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
          <div className="flex items-end justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-[#ff5722] mb-2">
                Account · Orders
              </div>
              <h1 className="font-['Space_Grotesk'] text-3xl md:text-4xl font-bold tracking-tight">
                Order history
              </h1>
              <p className="text-sm text-[#9ca3af] mt-2">
                Every purchase is tracked as a support ticket so staff can reach you with fulfillment updates.
              </p>
            </div>
            <Link
              to="/store"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 border border-white/10 text-xs font-mono uppercase tracking-widest text-[#9ca3af] hover:border-[#ff5722] hover:text-[#ff5722] transition"
            >
              Back to store
            </Link>
          </div>

          {loading ? (
            <div className="text-sm text-[#9ca3af] font-mono">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="border border-white/10 bg-[#12121a] p-10 text-center space-y-3">
              <Package className="w-8 h-8 mx-auto text-[#5f6472]" strokeWidth={1.5} />
              <div className="font-['Space_Grotesk'] text-xl">No orders yet</div>
              <p className="text-sm text-[#9ca3af]">When you place an order it will show up here.</p>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 border border-[#ff5722]/60 text-[#ff5722] hover:bg-[#ff5722] hover:text-white text-xs font-mono uppercase tracking-widest transition"
              >
                Browse the store <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => {
                const meta = statusMeta[o.status] ?? statusMeta.open;
                const Icon = meta.Icon;
                const firstLines = o.body
                  .split("\n")
                  .filter((l) => l.startsWith("•") || l.startsWith("- "))
                  .slice(0, 4);
                return (
                  <Link
                    key={o.id}
                    to={`/tickets?ticket=${o.id}`}
                    className="block bg-[#12121a] border border-white/10 hover:border-[#ff5722]/50 transition p-5 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono tracking-widest uppercase text-[#5f6472]">
                            #{o.id.slice(0, 8)}
                          </span>
                          <span className="text-[10px] font-mono text-[#5f6472]">·</span>
                          <span className="text-[10px] font-mono text-[#9ca3af]">
                            {new Date(o.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="font-['Space_Grotesk'] text-lg font-semibold text-slate-100 truncate">
                          {o.subject}
                        </div>
                        {firstLines.length > 0 && (
                          <ul className="mt-2 space-y-0.5 text-xs text-[#9ca3af] font-mono">
                            {firstLines.map((l, i) => (
                              <li key={i} className="truncate">{l}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-mono tracking-widest uppercase ${meta.className}`}
                        >
                          <Icon className={`w-3 h-3 ${o.status === "in_progress" ? "animate-spin" : ""}`} />
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-mono text-[#5f6472] group-hover:text-[#ff5722] transition inline-flex items-center gap-1">
                          View <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
