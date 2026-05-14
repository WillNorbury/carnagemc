import { Link } from "react-router-dom";
import logo from "@/assets/zyphora-logo.png";
import { Twitter, Youtube, MessageCircle, Twitch } from "lucide-react";

const Footer = () => (
  <footer className="relative border-t border-primary/20 bg-card/40 mt-24 overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
    <div className="container py-14 grid md:grid-cols-4 gap-10">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <img src={logo} alt="ZyphoraMC" className="h-9 w-9" />
          <span className="font-display font-bold text-lg tracking-wider">
            ZYPHORA<span className="text-gradient">MC</span>
          </span>
        </div>
        <p className="text-sm text-muted-foreground max-w-md">
          The ultimate Minecraft Lifesteal & Economy experience. Forge your legend in a world that bites back.
        </p>
        <div className="flex items-center gap-3 mt-5">
          {[
            { icon: MessageCircle, href: "https://discord.zyphoramc.net", label: "Discord" },
            { icon: Twitter, href: "https://x.com/ZyphoraMC", label: "Twitter" },
            { icon: Youtube, href: "https://youtube.com/@Zyphora_Network", label: "YouTube" },
            { icon: Twitch, href: "https://twitch.tv/Will_Norbury", label: "Twitch" },
          ].map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              target="_blank"
              rel="noreferrer"
              className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/60 hover:shadow-[0_0_16px_hsl(var(--primary)/0.5)] transition"
            >
              <s.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3 uppercase tracking-wider text-sm">Navigate</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-primary transition">
              Home
            </Link>
          </li>
          <li>
            <Link to="/community" className="hover:text-primary transition">
              Community
            </Link>
          </li>
          <li>
            <Link to="/rules" className="hover:text-primary transition">
              Rules
            </Link>
          </li>
          <li>
            <Link to="/support" className="hover:text-primary transition">
              Support
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-display font-semibold mb-3 uppercase tracking-wider text-sm">Server</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            IP: <span className="text-foreground font-mono">play.xylomc.net</span>
          </li>
          <li>Version: 1.21.x Velocity</li>
          <li>
            <a href="https://discord.zyphoramc.net" className="hover:text-primary transition">
              Join Discord
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border/50 py-5 text-center text-xs text-muted-foreground tracking-wider">
      © {new Date().getFullYear()} ZyphoraMC — All rights reserved. Not affiliated with Mojang or Microsoft.
    </div>
  </footer>
);

export default Footer;
