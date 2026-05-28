import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/xylo-logo.png";
import {
  Home,
  Newspaper,
  ClipboardList,
  Users as UsersIcon,
  ShieldCheck,
  Vote as VoteIcon,
  ScrollText,
  Puzzle,
  FileText,
  LifeBuoy,
  LayoutDashboard,
  User as UserIcon,
  Shield,
  LogIn,
  LogOut,
  Ticket,
  Trophy,
  HelpCircle,
  Calendar,
  Store,
  Boxes,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const publicLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/users", label: "Users", icon: UsersIcon },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/news", label: "News", icon: Newspaper },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/changelog", label: "Changelog", icon: ClipboardList },
  { to: "/mods", label: "Mods", icon: Boxes },
  { to: "/mod-tiers", label: "Mod Tiers", icon: Star },
  { to: "/community", label: "Community", icon: UsersIcon },
  { to: "/staff", label: "Staff", icon: ShieldCheck },
  { to: "/vote", label: "Vote", icon: VoteIcon, soon: true },
  { to: "/rules", label: "Rules", icon: ScrollText },
  { to: "/plugins", label: "Plugins", icon: Puzzle },
  { to: "/apply", label: "Apply", icon: FileText },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
  { to: "/support", label: "Support", icon: LifeBuoy },
];

const accountLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: UserIcon },
  { to: "/tickets", label: "Tickets", icon: Ticket },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) => pathname === path;
  const renderItem = (l: { to: string; label: string; icon: typeof Home; soon?: boolean }) => (
    <SidebarMenuItem key={l.to}>
      <SidebarMenuButton
        asChild={!l.soon}
        isActive={isActive(l.to)}
        tooltip={l.soon ? `${l.label} (Soon)` : l.label}
        disabled={l.soon}
        aria-disabled={l.soon}
        className={l.soon ? "opacity-60 cursor-not-allowed" : ""}
      >
        {l.soon ? (
          <div className="flex items-center gap-2">
            <l.icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="uppercase tracking-wider text-xs flex items-center gap-1">
                {l.label}
                <span className="text-[10px] text-muted-foreground normal-case tracking-normal">(Soon)</span>
              </span>
            )}
          </div>
        ) : (
          <Link to={l.to} onClick={closeMobile} className="flex items-center gap-2">
            <l.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="uppercase tracking-wider text-xs">{l.label}</span>}
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1 group">
          <img src={logo} alt="XyloMC" className="h-8 w-8 transition-transform group-hover:scale-110" />
          {!collapsed && (
            <span className="font-display font-bold text-base tracking-wider">
              XYLO<span className="text-gradient">MC</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{publicLinks.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{accountLinks.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItem({ to: "/admin", label: "Admin", icon: Shield })}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              nav("/");
            }}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-1">Sign out</span>}
          </Button>
        ) : (
          <Button size="sm" onClick={() => nav("/auth")} className="w-full justify-start glow">
            <LogIn className="h-4 w-4" />
            {!collapsed && <span className="ml-1">Sign in</span>}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
