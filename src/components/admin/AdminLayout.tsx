import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/havocsmp-logo.png.asset.json";
const logo = logoAsset.url;
import { ThemeToggle } from "@/components/site/ThemeToggle";
import {
  LayoutDashboard,
  Users,
  Newspaper,
  FileText,
  Server,
  ScrollText,
  Activity,
  PanelLeft,
  LogOut,
  Shield,
  Bot,
  Code,
  Ticket,
  KeyRound,
  Puzzle,
  ClipboardList,
  Zap,
  Sparkles,
  Gavel,
  HelpCircle,
  Calendar,
  Wrench,
  Menu,
  Boxes,
  Package,
  Database,
  Sun,
  Layers,
  Globe,
  Mail,
  Brain,
  Flag,
  Send,
  ShieldCheck,
} from "lucide-react";

export type AdminSection =
  | "dashboard"
  | "users"
  | "roles"
  | "permissions"
  | "news"
  | "content"
  | "status"
  | "logs"
  | "tickets"
  | "plugins"
  | "changelog"
  | "applications"
  | "apply"
  | "features"
  | "rules"
  | "alerts"
  | "maintenance"
  | "faqs"
  | "events"
  | "mods"
  | "resource-packs"
  | "data-packs"
  | "shaders"
  | "modpacks"
  | "servers"
  | "ban-appeals"
  | "wiki"
  | "gallery"
  | "contact"
  | "email-test"
  | "send-email"
  | "email-diagnostics"
  | "quizzes"
  | "reports"
  | "bot-dashboard"
  | "bot-management";

type NavItem =
  | { kind: "link"; id: AdminSection; icon: any; label: string }
  | { kind: "route"; to: string; icon: any; label: string }
  | { kind: "section"; title: string; icon: any };

const items: NavItem[] = [
  { kind: "link", id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { kind: "link", id: "users", icon: Users, label: "Users" },
  { kind: "link", id: "roles", icon: Shield, label: "Roles" },
  { kind: "link", id: "permissions", icon: KeyRound, label: "Permissions" },
  { kind: "link", id: "news", icon: Newspaper, label: "News" },
  { kind: "link", id: "content", icon: FileText, label: "Site Content" },
  { kind: "link", id: "status", icon: Server, label: "Server Status" },
  { kind: "link", id: "alerts", icon: Activity, label: "Alert Settings" },
  { kind: "link", id: "tickets", icon: Ticket, label: "Support Tickets" },
  { kind: "link", id: "logs", icon: ScrollText, label: "Admin Logs" },
  { kind: "link", id: "plugins", icon: Puzzle, label: "Plugins" },
  { kind: "link", id: "resource-packs", icon: Package, label: "Resource Packs" },
  { kind: "link", id: "data-packs", icon: Database, label: "Data Packs" },
  { kind: "link", id: "shaders", icon: Sun, label: "Shaders" },
  { kind: "link", id: "modpacks", icon: Layers, label: "Modpacks" },
  { kind: "link", id: "servers", icon: Globe, label: "Servers" },
  { kind: "link", id: "changelog", icon: Zap, label: "Changelog" },
  { kind: "link", id: "applications", icon: ClipboardList, label: "Applications" },
  { kind: "link", id: "apply", icon: ClipboardList, label: "Apply (types)" },
  { kind: "link", id: "features", icon: Sparkles, label: "Features" },
  { kind: "link", id: "rules", icon: Gavel, label: "Rules" },

  { kind: "link", id: "faqs", icon: HelpCircle, label: "FAQs" },
  { kind: "link", id: "events", icon: Calendar, label: "Events" },
  { kind: "link", id: "mods", icon: Boxes, label: "Mods" },
  { kind: "link", id: "maintenance", icon: Wrench, label: "Maintenance" },
  { kind: "link", id: "ban-appeals", icon: Gavel, label: "Ban Appeals" },
  { kind: "link", id: "wiki", icon: FileText, label: "Wiki" },
  { kind: "link", id: "gallery", icon: Package, label: "Gallery" },
  { kind: "link", id: "contact", icon: HelpCircle, label: "Contact" },
  { kind: "link", id: "email-test", icon: Mail, label: "Email Test" },
  { kind: "link", id: "send-email", icon: Send, label: "Send Email" },
  { kind: "link", id: "email-diagnostics", icon: ShieldCheck, label: "Email Diagnostics" },
  { kind: "link", id: "quizzes", icon: Brain, label: "Quizzes" },
  { kind: "link", id: "reports", icon: Flag, label: "Reports" },
  { kind: "section", title: "Discord Bot", icon: Bot },
  { kind: "link", id: "bot-dashboard", icon: LayoutDashboard, label: "Bot Dashboard" },
  { kind: "link", id: "bot-management", icon: Code, label: "Management" },
];

export const AdminLayout = ({
  current,
  onNavigate,
  title,
  description,
  actions,
  children,
  isOwner,
}: {
  current: AdminSection;
  onNavigate: (s: AdminSection) => void;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  isOwner?: boolean;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { signOut, user } = useAuth();

  const visibleItems = items.filter((it) => {
    if (it.kind === "section" && it.title === "Discord Bot") return isOwner ?? false;
    if (it.kind === "link" && (it.id === "bot-dashboard" || it.id === "bot-management" || it.id === "permissions"))
      return isOwner ?? false;
    return true;
  });

  const handleNavigate = (s: AdminSection) => {
    onNavigate(s);
    setMobileOpen(false);
  };

  const navContent = (forceExpanded = false) => {
    const isCollapsed = forceExpanded ? false : collapsed;
    return (
      <>
        <div
          className={cn(
            "flex h-[60px] items-center border-b px-4 shrink-0",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2 font-semibold" onClick={() => setMobileOpen(false)}>
              <img src={logo} alt="CarnageMC" className="h-7 w-7" />
              <span className="text-lg">
                CARNAGE<span className="text-gradient">MC</span>
              </span>
            </Link>
          )}
          {!forceExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden md:inline-flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {visibleItems.map((it, idx) => {
            if (it.kind === "section") {
              const SIcon = it.icon;
              if (isCollapsed) return <div key={`s-${idx}`} className="my-2 border-t border-border/60" />;
              return (
                <div
                  key={`s-${idx}`}
                  className="px-3 pt-4 pb-1 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground/80"
                >
                  <SIcon className="h-3 w-3" />
                  {it.title}
                </div>
              );
            }
            const Icon = it.icon;
            if (it.kind === "route") {
              const routeBtn = (
                <Link
                  to={it.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg w-full transition-all hover:bg-accent hover:text-foreground text-muted-foreground",
                    isCollapsed ? "h-9 w-9 justify-center mx-auto" : "px-3 py-2",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span className="text-sm">{it.label}</span>}
                </Link>
              );
              return isCollapsed ? (
                <Tooltip key={it.to}>
                  <TooltipTrigger asChild>{routeBtn}</TooltipTrigger>
                  <TooltipContent side="right">{it.label}</TooltipContent>
                </Tooltip>
              ) : (
                <div key={it.to}>{routeBtn}</div>
              );
            }
            const active = it.id === current;
            const btn = (
              <button
                onClick={() => handleNavigate(it.id)}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg w-full transition-all hover:bg-accent hover:text-foreground text-muted-foreground",
                  isCollapsed ? "h-9 w-9 justify-center mx-auto" : "px-3 py-2",
                  active && "bg-accent text-foreground",
                )}
              >
                {active && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-primary" />}
                <Icon className="h-4 w-4" />
                {!isCollapsed && <span className="text-sm">{it.label}</span>}
              </button>
            );
            return isCollapsed ? (
              <Tooltip key={it.id}>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right">{it.label}</TooltipContent>
              </Tooltip>
            ) : (
              <div key={it.id}>{btn}</div>
            );
          })}
        </nav>

        <div className="mt-auto border-t p-2 shrink-0">
          {!isCollapsed && user && <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>}
          <Button
            variant="ghost"
            className={cn(
              "w-full text-muted-foreground",
              isCollapsed ? "h-9 w-9 justify-center p-0" : "justify-start gap-3 px-3",
            )}
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "relative hidden md:flex flex-col h-screen sticky top-0 border-r bg-card transition-all duration-300 ease-in-out",
            collapsed ? "w-20" : "w-64",
          )}
        >
          {navContent()}
        </aside>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-72 flex flex-col bg-card">
            {navContent(true)}
          </SheetContent>
        </Sheet>

        <ScrollArea className="h-screen flex-1 w-full">
          <main className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
            {/* Mobile top bar */}
            <div className="flex md:hidden items-center justify-between -mx-4 px-4 py-2 border-b -mt-2 sticky top-2 z-30 bg-background/95 backdrop-blur rounded-b-lg mx-0 mt-2 mb-2 shadow-sm">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Link to="/" className="flex items-center gap-2 font-semibold">
                <img src={logo} alt="CarnageMC" className="h-6 w-6" />
                <span className="text-sm">
                  XYLO<span className="text-gradient">MC</span>
                </span>
              </Link>
              <ThemeToggle />
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{title}</h1>
                {description && <p className="mt-1.5 text-sm md:text-base text-muted-foreground">{description}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {actions}
                <ThemeToggle className="hidden md:inline-flex" />
              </div>
            </div>
            <div className="min-w-0 overflow-x-auto">{children}</div>
          </main>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
};
