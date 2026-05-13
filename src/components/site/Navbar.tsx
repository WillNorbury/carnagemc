import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/zyphora-logo.png";
import { LogIn, Shield, LogOut, Menu, X, LifeBuoy, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { to: "/", label: "Home" },
  { to: "/news", label: "News" },
  { to: "/changelog", label: "Changelog" },
  { to: "/community", label: "Community" },
  { to: "/staff", label: "Staff" },
  { to: "/vote", label: "Vote" },
  { to: "/rules", label: "Rules" },
  { to: "/plugins", label: "Plugins" },
  { to: "/apply", label: "Apply" },
  { to: "/support", label: "Support" },
];

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "bg-background/85 backdrop-blur-xl border-b border-primary/20 shadow-elegant" : "bg-transparent"}`}>
      <nav className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logo} alt="ZyphoraMC" className="h-9 w-9 transition-transform group-hover:scale-110" />
          <span className="font-display font-bold text-lg tracking-wider">
            ZYPHORA<span className="text-gradient">MC</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-7 text-sm font-medium uppercase tracking-wider">
          {links.map((l) => {
            const active = loc.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative transition ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {l.label}
                {active && <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full" />}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <Button variant="ghost" size="sm" onClick={() => nav("/dashboard")} className="hidden md:inline-flex">
              <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
            </Button>
          )}
          {user && (
            <Button variant="ghost" size="sm" onClick={() => nav("/tickets")} className="hidden md:inline-flex">
              <LifeBuoy className="h-4 w-4 mr-1" /> Tickets
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => nav("/admin")} className="hidden md:inline-flex">
              <Shield className="h-4 w-4 mr-1" /> Admin
            </Button>
          )}
          {user ? (
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); nav("/"); }} className="hidden md:inline-flex">
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          ) : (
            <Button size="sm" onClick={() => nav("/auth")} className="hidden md:inline-flex glow">
              <LogIn className="h-4 w-4 mr-1" /> Sign in
            </Button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 rounded-md hover:bg-secondary transition"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm uppercase tracking-wider py-1 hover:text-primary transition">
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => nav("/admin")} className="justify-start">
                <Shield className="h-4 w-4 mr-1" /> Admin
              </Button>
            )}
            {user ? (
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); nav("/"); }}>
                <LogOut className="h-4 w-4 mr-1" /> Sign out
              </Button>
            ) : (
              <Button size="sm" onClick={() => nav("/auth")}>
                <LogIn className="h-4 w-4 mr-1" /> Sign in
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
