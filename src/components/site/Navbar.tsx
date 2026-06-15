import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import logoAsset from "@/assets/havocsmp-logo.png.asset.json";
const logo = logoAsset.url;
import { LogIn, LogOut, LayoutDashboard, User as UserIcon, Shield, Download } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsBell } from "./NotificationsBell";

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-primary/20 shadow-elegant"
          : "bg-background/40 backdrop-blur-sm border-b border-border/40"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center justify-between gap-2 h-14 px-3 md:px-6 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger />
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            <img src={logo} alt="HavocSMP" className="h-7 w-7 shrink-0 transition-transform group-hover:scale-110" />
            <span className="font-display font-bold text-sm md:text-base tracking-wider truncate">
              HAVOC<span className="text-gradient">SMP</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <GlobalSearch />
          <ThemeToggle />
          {user && (
            <Button variant="ghost" size="sm" onClick={() => nav("/dashboard")} className="hidden sm:inline-flex">
              <LayoutDashboard className="h-4 w-4 sm:mr-1" />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
          )}
          {user && (
            <Button variant="ghost" size="sm" onClick={() => nav("/profile")} className="hidden sm:inline-flex">
              <UserIcon className="h-4 w-4 sm:mr-1" />
              <span className="hidden md:inline">Profile</span>
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => nav("/admin")} className="hidden sm:inline-flex">
              <Shield className="h-4 w-4 sm:mr-1" />
              <span className="hidden md:inline">Admin</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => nav("/install")} title="How to install">
            <Download className="h-4 w-4 sm:mr-1" />
            <span className="hidden md:inline">How to install</span>
          </Button>
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                nav("/");
              }}
            >
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <Button size="sm" onClick={() => nav("/auth")} className="glow">
              <LogIn className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Sign in</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
