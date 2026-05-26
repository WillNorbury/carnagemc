import { useEffect } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Particles from "@/components/site/Particles";
import { Badge } from "@/components/ui/badge";
import { Store, Sparkles } from "lucide-react";

const Store = () => {
  useEffect(() => {
    document.title = "Store — XyloMC";
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        <Particles count={20} />
        <div className="absolute inset-0 bg-grid opacity-[0.08]" />
        <div className="container relative text-center py-20">
          <Badge variant="secondary" className="mb-4 text-primary border-primary/40">
            <Sparkles className="h-3 w-3 mr-1" /> Coming Soon
          </Badge>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Store className="h-10 w-10 text-primary" />
            <h1 className="font-display text-4xl md:text-6xl font-black">
              Store <span className="text-gradient">(Soon)</span>
            </h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The XyloMC store is under construction. Soon you'll be able to browse ranks, crates, cosmetics, and more.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Store;
