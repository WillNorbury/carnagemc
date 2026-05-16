import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Particles from "@/components/site/Particles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Ticket as TicketIcon, Plus, Send, ChevronLeft, MessageSquare, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Ticket = {
  id: string;
  subject: string;
  body: string;
  category: string | null;
  status: "open" | "in_progress" | "waiting_user" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  user_id: string;
};

type Message = {
  id: string;
  ticket_id: string;
  author_id: string;
  is_staff: boolean;
  body: string;
  created_at: string;
};

const STATUS_META: Record<Ticket["status"], { label: string; color: string; icon: any }> = {
  open: { label: "Open", color: "bg-primary/15 text-primary border-primary/40", icon: AlertCircle },
  in_progress: { label: "In progress", color: "bg-amber-500/15 text-amber-400 border-amber-500/40", icon: Loader2 },
  waiting_user: { label: "Waiting on you", color: "bg-sky-500/15 text-sky-400 border-sky-500/40", icon: Clock },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border", icon: CheckCircle2 },
};

const PRIORITY_META: Record<Ticket["priority"], { label: string; color: string }> = {
  low: { label: "Low", color: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", color: "bg-secondary text-secondary-foreground" },
  high: { label: "High", color: "bg-amber-500/20 text-amber-400" },
  urgent: { label: "Urgent", color: "bg-destructive/20 text-destructive" },
};

const ticketSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(200, "Subject too long"),
  body: z.string().trim().min(5, "Please describe your issue (min 5 characters)").max(4000, "Description too long"),
  category: z.string().max(50).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});

const replySchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(4000, "Message too long"),
});

const Tickets = () => {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => { document.title = "My Tickets — XyloMC"; }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { nav("/auth?redirect=/tickets"); return; }
    load();
  }, [user, authLoading]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setTickets((data ?? []) as Ticket[]);
    setLoading(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
    );
  }

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative pt-28 pb-10 overflow-hidden">
          <Particles count={18} />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />
          <div className="container relative">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-3 text-primary border-primary/40">
                  <TicketIcon className="h-3 w-3 mr-1" /> Support Tickets
                </Badge>
                <h1 className="font-display text-3xl md:text-5xl font-black">
                  My <span className="text-gradient">Tickets</span>
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">Track requests and chat with our staff.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild><Link to="/support"><ChevronLeft className="h-4 w-4 mr-1" /> Back to Support</Link></Button>
                <Button className="glow" onClick={() => { setSelectedId(null); setCreating(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> New Ticket
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container pb-16 grid lg:grid-cols-[360px_1fr] gap-6">
          {/* List */}
          <Card className="p-4 max-h-[75vh] overflow-y-auto">
            {loading ? (
              <div className="text-sm text-muted-foreground p-6 text-center">Loading…</div>
            ) : tickets.length === 0 ? (
              <div className="text-sm text-muted-foreground p-6 text-center">
                No tickets yet. Click "New Ticket" to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => {
                  const sm = STATUS_META[t.status];
                  const Icon = sm.icon;
                  const active = selectedId === t.id && !creating;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setCreating(false); setSelectedId(t.id); }}
                      className={`w-full text-left p-3 rounded-lg border transition ${active ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-secondary/30"}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="font-semibold text-sm truncate">{t.subject}</div>
                        <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${sm.color} flex items-center gap-1 shrink-0`}>
                          <Icon className="h-3 w-3" /> {sm.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{t.body}</div>
                      <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">
                        #{t.id.slice(0, 8)} · {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Detail / Create */}
          <div>
            {creating ? (
              <NewTicketForm
                onCancel={() => setCreating(false)}
                onCreated={(id) => { setCreating(false); load(); setSelectedId(id); }}
                userId={user.id}
              />
            ) : selected ? (
              <TicketDetail ticket={selected} userId={user.id} onChanged={load} />
            ) : (
              <Card className="p-12 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-primary/60" />
                <p>Select a ticket to view the conversation, or create a new one.</p>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const NewTicketForm = ({ onCancel, onCreated, userId }: { onCancel: () => void; onCreated: (id: string) => void; userId: string }) => {
  const [form, setForm] = useState({ subject: "", body: "", category: "Account & Login", priority: "normal" as Ticket["priority"] });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ticketSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSending(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        subject: parsed.data.subject,
        body: parsed.data.body,
        category: parsed.data.category ?? null,
        priority: parsed.data.priority,
        user_id: userId,
      })
      .select("id")
      .single();
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Ticket submitted");
    onCreated(data.id);
  };

  return (
    <Card className="p-7 border-primary/30">
      <h2 className="font-display text-2xl font-bold mb-1">New Ticket</h2>
      <p className="text-sm text-muted-foreground mb-5">Tell us what's going on and we'll get back to you.</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="subject">Subject *</Label>
          <Input id="subject" maxLength={200} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief summary of your issue" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Account & Login">Account & Login</SelectItem>
                <SelectItem value="Store & Payments">Store & Payments</SelectItem>
                <SelectItem value="Bugs & Issues">Bugs & Issues</SelectItem>
                <SelectItem value="Gameplay Help">Gameplay Help</SelectItem>
                <SelectItem value="Report a Player">Report a Player</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="body">Description *</Label>
          <Textarea id="body" rows={8} maxLength={4000} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Steps to reproduce, screenshots links, etc." />
          <p className="text-xs text-muted-foreground mt-1">{form.body.length}/4000</p>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={sending} className="glow">
            <Send className="h-4 w-4 mr-2" /> {sending ? "Submitting…" : "Submit Ticket"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
};

const TicketDetail = ({ ticket, userId, onChanged }: { ticket: Ticket; userId: string; onChanged: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const sm = STATUS_META[ticket.status];
  const pm = PRIORITY_META[ticket.priority];

  const loadMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setMessages((data ?? []) as Message[]);
    setLoading(false);
  };

  useEffect(() => { loadMessages(); }, [ticket.id]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_ticket_messages", filter: `ticket_id=eq.${ticket.id}` }, (payload) => {
        setMessages((prev) => prev.some((m) => m.id === (payload.new as any).id) ? prev : [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticket.id]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = replySchema.safeParse({ body: reply });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSending(true);
    const { error } = await supabase.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      author_id: userId,
      is_staff: false,
      body: parsed.data.body,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setReply("");
    loadMessages();
  };

  const closeTicket = async () => {
    const { error } = await supabase.from("support_tickets").update({ status: "closed" }).eq("id", ticket.id);
    if (error) return toast.error(error.message);
    toast.success("Ticket closed");
    onChanged();
  };

  const reopenTicket = async () => {
    // Users can't update status directly (admins-only RLS). Send a reply instead.
    toast.info("Send a reply to reopen — staff will be notified.");
  };

  const Icon = sm.icon;

  return (
    <Card className="p-6 md:p-7 border-primary/20">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-4 border-b border-border/60">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">#{ticket.id.slice(0, 8)} · {ticket.category ?? "General"}</div>
          <h2 className="font-display text-2xl font-bold">{ticket.subject}</h2>
          <div className="text-xs text-muted-foreground mt-1">Opened {new Date(ticket.created_at).toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs uppercase tracking-wider px-2 py-1 rounded border ${sm.color} flex items-center gap-1`}>
            <Icon className="h-3 w-3" /> {sm.label}
          </span>
          <span className={`text-xs uppercase tracking-wider px-2 py-1 rounded ${pm.color}`}>{pm.label}</span>
        </div>
      </div>

      {/* Original */}
      <MessageBubble
        author="You"
        when={ticket.created_at}
        body={ticket.body}
        isStaff={false}
        isMine
      />

      {/* Replies */}
      <div className="space-y-3 mt-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading messages…</div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              author={m.is_staff ? "Staff" : "You"}
              when={m.created_at}
              body={m.body}
              isStaff={m.is_staff}
              isMine={m.author_id === userId && !m.is_staff}
            />
          ))
        )}
      </div>

      {/* Reply form */}
      {ticket.status !== "closed" ? (
        <form onSubmit={sendReply} className="mt-5 pt-5 border-t border-border/60 space-y-3">
          <Label>Reply</Label>
          <Textarea rows={4} maxLength={4000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add a message…" />
          <div className="flex justify-between items-center">
            <Button type="button" variant="ghost" size="sm" onClick={closeTicket}>Close ticket</Button>
            <Button type="submit" disabled={sending || !reply.trim()} className="glow">
              <Send className="h-4 w-4 mr-2" /> {sending ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-5 pt-5 border-t border-border/60 text-center">
          <p className="text-sm text-muted-foreground mb-3">This ticket is closed.</p>
          <Button variant="outline" size="sm" onClick={reopenTicket}>Need more help?</Button>
        </div>
      )}
    </Card>
  );
};

const MessageBubble = ({ author, when, body, isStaff, isMine }: { author: string; when: string; body: string; isStaff: boolean; isMine: boolean }) => (
  <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[85%] rounded-lg p-4 border ${isStaff ? "bg-primary/10 border-primary/40" : isMine ? "bg-secondary/60 border-border" : "bg-card border-border"}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-xs font-display font-bold uppercase tracking-wider ${isStaff ? "text-primary" : "text-foreground"}`}>{author}</span>
        {isStaff && <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/40 text-primary">Staff</Badge>}
        <span className="text-[10px] text-muted-foreground">{new Date(when).toLocaleString()}</span>
      </div>
      <div className="text-sm whitespace-pre-wrap break-words">{body}</div>
    </div>
  </div>
);

export default Tickets;
