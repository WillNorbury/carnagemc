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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/lib/auth";
import logoAsset from "@/assets/carnagemc-logo.png.asset.json";
const logo = logoAsset.url;
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
  Boxes,
  Star,
  Sparkles,
  Activity,
  Download,
  Package,
  Database,
  Sun,
  Layers,
  Server as ServerIcon,
  Link2,
  BookOpen,
  Image as ImageIcon,
  Mail,
  Gavel,
  ChevronDown,
  Clock,
  Compass,
  Globe,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: typeof Home; soon?: boolean };
type NavGroup = { id: string; label: string; icon: typeof Home; items: NavItem[]; defaultOpen?: boolean };

const websiteGroup: NavGroup = {
  id: "websites",
  label: "Websites",
  icon: Globe,
  items: [
    { to: "https://portfolio.carnagemc.net", label: "Portfolio", icon: Link2 },
    { to: "https://panel.voxelnode.dev", label: "VoxelNode", icon: Link2 },
  ],
};

const mainGroup: NavGroup = {
  id: "main",
  label: "Main",
  icon: Home,
  defaultOpen: true,
  items: [
    { to: "/", label: "Home", icon: Home },
    { to: "/news", label: "News", icon: Newspaper },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/changelog", label: "Changelog", icon: ClipboardList },
    { to: "/features", label: "Features", icon: Sparkles },
    { to: "/status", label: "Status", icon: Activity },
  ],
};

const communityGroup: NavGroup = {
  id: "community",
  label: "Community",
  icon: UsersIcon,
  items: [
    { to: "/users", label: "Users", icon: UsersIcon },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/community", label: "Community", icon: UsersIcon },
    { to: "/staff", label: "Staff", icon: ShieldCheck },
    { to: "/mod-tiers", label: "Mod Tiers", icon: Star },
    { to: "/gallery", label: "Gallery", icon: ImageIcon },
  ],
};

const helpGroup: NavGroup = {
  id: "help",
  label: "Help & Info",
  icon: Info,
  items: [
    { to: "/rules", label: "Rules", icon: ScrollText },
    { to: "/faq", label: "FAQ", icon: HelpCircle },
    { to: "/wiki", label: "Wiki", icon: BookOpen },
    { to: "/install", label: "How to Install", icon: Download },
    { to: "/support", label: "Support", icon: LifeBuoy },
    { to: "/contact", label: "Contact", icon: Mail },
  ],
};

const actionsGroup: NavGroup = {
  id: "actions",
  label: "Actions",
  icon: FileText,
  items: [
    { to: "/apply", label: "Apply", icon: FileText },
    { to: "/ban-appeals", label: "Ban Appeals", icon: Gavel },
  ],
};

const discoverGroup: NavGroup = {
  id: "discover",
  label: "Discover",
  icon: Compass,
  items: [
    { to: "/discover/mods", label: "Mods", icon: Boxes },
    { to: "/discover/plugins", label: "Plugins", icon: Puzzle },
    { to: "/discover/modpacks", label: "Modpacks", icon: Package },
    { to: "/discover/resource-packs", label: "Resource Packs", icon: Layers },
    { to: "/discover/data-packs", label: "Data Packs", icon: Database },
    { to: "/discover/shaders", label: "Shaders", icon: Sun },
    { to: "/discover/servers", label: "Servers", icon: ServerIcon },
  ],
};

const soonGroup: NavGroup = {
  id: "soon",
  label: "Coming Soon",
  icon: Clock,
  items: [{ to: "/vote", label: "Vote", icon: VoteIcon, soon: true }],
};

const accountGroup: NavGroup = {
  id: "account",
  label: "Account",
  icon: UserIcon,
  items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/profile", label: "Profile", icon: UserIcon },
    { to: "/tickets", label: "Tickets", icon: Ticket },
    { to: "/link-account", label: "Link Account", icon: Link2 },
  ],
};

const publicGroups: NavGroup[] = [
  websiteGroup,
  mainGroup,
  communityGroup,
  helpGroup,
  actionsGroup,
  discoverGroup,
  soonGroup,
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
  const isExternal = (path: string) => /^https?:\/\//.test(path);

  const renderItem = (l: NavItem) => (
    <SidebarMenuItem key={l.to}>
      <SidebarMenuButton
        asChild={!l.soon}
        isActive={!isExternal(l.to) && isActive(l.to)}
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
        ) : isExternal(l.to) ? (
          <a href={l.to} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <l.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="uppercase tracking-wider text-xs">{l.label}</span>}
          </a>
        ) : (
          <Link to={l.to} onClick={closeMobile} className="flex items-center gap-2">
            <l.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="uppercase tracking-wider text-xs">{l.label}</span>}
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderGroup = (g: NavGroup) => {
    const hasActive = g.items.some((i) => !isExternal(i.to) && isActive(i.to));
    const defaultOpen = g.defaultOpen || hasActive;

    if (collapsed) {
      // When collapsed, just render items flat with tooltips (no dropdown UI).
      return (
        <SidebarGroup key={g.id}>
          <SidebarGroupContent>
            <SidebarMenu>{g.items.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <Collapsible key={g.id} defaultOpen={defaultOpen} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 hover:text-foreground transition-colors">
              <span className="flex items-center gap-2">
                <g.icon className="h-3.5 w-3.5" />
                {g.label}
              </span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=closed]/collapsible:-rotate-90" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>{g.items.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-1 group">
          <img src={logo} alt="CarnageMC" className="h-8 w-8 transition-transform group-hover:scale-110" />
          {!collapsed && (
            <span className="font-display font-bold text-base tracking-wider">
              CARNAGE<span className="text-gradient">MC</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {publicGroups.map(renderGroup)}

        {user && renderGroup(accountGroup)}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItem({ to: "/admin", label: "Admin", icon: Shield })}</SidebarMenu>
            </SidebarGroupContent>
            ,
            <SidebarGroupContent>
              <SidebarMenu>
                {renderItem({ to: "https://staffchat.carnagemc.net", label: "StaffChat", icon: Link2 })}
              </SidebarMenu>
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
