import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import logoAsset from "@/assets/carnagemc-logo.png.asset.json";
const logo = logoAsset.url;
import { LogIn, LogOut, LayoutDashboard, User as UserIcon, Shield, Download, ShoppingCart, MoreHorizontal } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsBell } from "./NotificationsBell";
import { useCart } from "@/lib/cart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { count: cartCount, openCart } = useCart();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pill = cn(
    "fixed z-40 flex items-center rounded-full border transition-all duration-200",
    scrolled
      ? "border-border bg-background/90 backdrop-blur-xl shadow-elegant"
      : "border-border/50 bg-background/60 backdrop-blur-md",
  );

  return (
    <>
      {/* Floating brand / sidebar toggle (top-left) */}
      <div
        className={cn(pill, "gap-2 px-2 py-1.5")}
        style={{
          top: "max(0.75rem, env(safe-area-inset-top))",
          left: "max(0.75rem, env(safe-area-inset-left))",
        }}
      >
        <SidebarTrigger />
        <Link
          to="/"
          className="flex items-center gap-2 group min-w-0 pr-1"
          aria-label="CarnageMC home"
        >
          <img src={logo} alt="" aria-hidden className="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-105" />
          <span className="font-display font-bold text-sm tracking-wider truncate hidden sm:inline">
            CARNAGE<span className="text-gradient">MC</span>
          </span>
        </Link>
      </div>

      {/* Floating right-hand menu */}
      <div
        className={cn(pill, "gap-0.5 px-1.5 py-1.5")}
        style={{
          top: "max(0.75rem, env(safe-area-inset-top))",
          right: "max(0.75rem, env(safe-area-inset-right))",
          maxWidth: "calc(100vw - 2rem)",
        }}
      >
        <GlobalSearch />
        <LanguageSwitcher />
        <NotificationsBell />
        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          onClick={openCart}
          title="Cart"
          aria-label={`Cart (${cartCount} item${cartCount === 1 ? "" : "s"})`}
          className="relative rounded-full"
        >
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-[18px] text-center shadow">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="More menu">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
            <DropdownMenuLabel>Menu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user && (
              <DropdownMenuItem onSelect={() => nav("/dashboard")}>
                <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
              </DropdownMenuItem>
            )}
            {user && (
              <DropdownMenuItem onSelect={() => nav("/profile")}>
                <UserIcon className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
            )}
            {isAdmin && (
              <DropdownMenuItem onSelect={() => nav("/admin")}>
                <Shield className="h-4 w-4 mr-2" /> Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => nav("/install")}>
              <Download className="h-4 w-4 mr-2" /> How to install
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user ? (
              <DropdownMenuItem
                onSelect={async () => {
                  await signOut();
                  nav("/");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => nav("/auth")}>
                <LogIn className="h-4 w-4 mr-2" /> Sign in
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default Navbar;
