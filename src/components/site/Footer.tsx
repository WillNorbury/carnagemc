import logo from "@/assets/zyphora-logo.png";

const Footer = () => (
  <footer className="border-t border-border/50 bg-card/40 mt-24">
    <div className="container py-12 grid md:grid-cols-3 gap-10">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <img src={logo} alt="ZyphoraMC" className="h-8 w-8" />
          <span className="font-bold">Zyphora<span className="text-primary">MC</span></span>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs">
          A premium Minecraft survival experience. Build, explore, conquer.
        </p>
      </div>
      <div>
        <h4 className="font-semibold mb-3">Server</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>IP: <span className="text-foreground font-mono">play.zyphoramc.net</span></li>
          <li>Version: 1.21.x Paper</li>
          <li>Premium & Cracked supported</li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-3">Community</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><a href="https://discord.zyphoramc.net" className="hover:text-primary">Discord</a></li>
          <li><a href="#faq" className="hover:text-primary">FAQ</a></li>
          <li><a href="#privacy" className="hover:text-primary">Privacy</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border/50 py-5 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} ZyphoraMC — All rights reserved.
    </div>
  </footer>
);

export default Footer;
