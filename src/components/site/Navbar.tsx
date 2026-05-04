import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/zyphora-logo.png";
import { LogIn, Shield, LogOut } from "lucide-react";

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <nav className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="ZyphoraMC" className="h-9 w-9" />
          <span className="font-bold text-lg tracking-tight">
            Zyphora<span className="text-primary">MC</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/news" className="hover:text-foreground transition">News</Link>
          <Link to="/staff" className="hover:text-foreground transition">Staff</Link>
          <Link to="/vote" className="hover:text-foreground transition">Vote</Link>
          <a href="/#rules" className="hover:text-foreground transition">Rules</a>
          <a href="/#faq" className="hover:text-foreground transition">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => nav("/admin")}>
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
      </nav>
    </header>
  );
};

export default Navbar;
