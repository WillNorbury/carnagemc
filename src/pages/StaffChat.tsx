import { useState } from "react";
import Navbar from "@/components/site/Navbar";
import { SEO } from "@/components/site/SEO";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const STAFFCHAT_URL = "https://staffchat.carnagemc.net";

export default function StaffChat() {
  const { isAdmin, loading } = useAuth();
  const [iframeLoading, setIframeLoading] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <SEO title="Staff Chat" description="Staff-only chat" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-display font-bold">Staff Only</h1>
            <p className="text-muted-foreground">You need staff permissions to access Staff Chat.</p>
            <Button asChild variant="outline">
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Staff Chat" description="Internal staff chat for CarnageMC" />
      <Navbar />
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Staff Chat</span>
        </div>
        <Button asChild size="sm" variant="ghost">
          <a href={STAFFCHAT_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" /> Open in new tab
          </a>
        </Button>
      </div>
      <div className="relative flex-1 bg-background">
        {iframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <iframe
          src={STAFFCHAT_URL}
          title="Staff Chat"
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 8rem)" }}
          onLoad={() => setIframeLoading(false)}
          allow="clipboard-read; clipboard-write; microphone; camera"
        />
      </div>
    </div>
  );
}
