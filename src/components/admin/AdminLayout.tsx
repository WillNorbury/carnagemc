import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Newspaper, FileText, Server, ScrollText,
  PanelLeft, LogOut, Shield,
} from "lucide-react";

export type AdminSection =
  | "dashboard" | "users" | "roles" | "news" | "content" | "status" | "logs";

const items: { id: AdminSection; icon: any; label: string }[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "users", icon: Users, label: "Users" },
  { id: "roles", icon: Shield, label: "Roles" },
  { id: "news", icon: Newspaper, label: "News" },
  { id: "content", icon: FileText, label: "Site Content" },
  { id: "status", icon: Server, label: "Server Status" },
  { id: "logs", icon: ScrollText, label: "Admin Logs" },
];

export const AdminLayout = ({
  current, onNavigate, title, description, actions, children,
}: {
  current: AdminSection;
  onNavigate: (s: AdminSection) => void;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user } = useAuth();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen bg-background text-foreground">
        <aside
          className={cn(
            "relative flex flex-col h-screen sticky top-0 border-r bg-card transition-all duration-300 ease-in-out",
            collapsed ? "w-20" : "w-64"
          )}
        >
          <div className={cn("flex h-[60px] items-center border-b px-4", collapsed ? "justify-center" : "justify-between")}>
            {!collapsed && (
              <Link to="/" className="flex items-center gap-2 font-semibold">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-lg">ZyphoraMC</span>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCollapsed(!collapsed)}>
              <PanelLeft className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
            {items.map((it) => {
              const Icon = it.icon;
              const active = it.id === current;
              const btn = (
                <button
                  onClick={() => onNavigate(it.id)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg w-full transition-all hover:bg-accent hover:text-foreground text-muted-foreground",
                    collapsed ? "h-9 w-9 justify-center mx-auto" : "px-3 py-2",
                    active && "bg-accent text-foreground"
                  )}
                >
                  {active && <span className="absolute left-0 h-6 w-1 rounded-r-full bg-primary" />}
                  <Icon className="h-4 w-4" />
                  {!collapsed && <span className="text-sm">{it.label}</span>}
                </button>
              );
              return collapsed ? (
                <Tooltip key={it.id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right">{it.label}</TooltipContent>
                </Tooltip>
              ) : <div key={it.id}>{btn}</div>;
            })}
          </nav>

          <div className="mt-auto border-t p-2">
            {!collapsed && user && (
              <div className="px-3 py-2 text-xs text-muted-foreground truncate">
                {user.email}
              </div>
            )}
            <Button
              variant="ghost"
              className={cn("w-full text-muted-foreground", collapsed ? "h-9 w-9 justify-center p-0" : "justify-start gap-3 px-3")}
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && "Logout"}
            </Button>
          </div>
        </aside>

        <ScrollArea className="h-screen flex-1">
          <main className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            {children}
          </main>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
};
