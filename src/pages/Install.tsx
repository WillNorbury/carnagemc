import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Apple, Share, Plus, CheckCircle2 } from "lucide-react";
import logo from "@/assets/xylo-logo.png";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios|edgios/i.test(navigator.userAgent);

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error legacy iOS
    window.navigator.standalone === true);

export default function Install() {
  const [promptEvt, setPromptEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIOS());
    setInstalled(isStandalone());
    const onBIP = (e: Event) => {
      e.preventDefault();
      setPromptEvt(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvt) return;
    await promptEvt.prompt();
    const { outcome } = await promptEvt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPromptEvt(null);
  };

  return (
    <>
      <Helmet>
        <title>Install HavocSMP — Add to Home Screen</title>
        <meta name="description" content="Install the HavocSMP web app to your phone or desktop for a fullscreen, app-like experience." />
        <link rel="canonical" href="/install" />
      </Helmet>

      <main className="container max-w-2xl py-10 px-4">
        <div className="flex flex-col items-center text-center mb-8">
          <img src={logo} alt="HavocSMP logo" className="h-20 w-20 mb-4" />
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-wider">
            Install <span className="text-gradient">HavocSMP</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Get the full HavocSMP experience as an installable web app — fullscreen, fast, and right on your home screen.
          </p>
        </div>

        {installed ? (
          <Card className="border-primary/40">
            <CardContent className="flex items-center gap-3 py-6">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <p className="font-medium">HavocSMP is installed. You're running the app version!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {promptEvt && (
              <Card className="mb-6 border-primary/40 glow">
                <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                  <div className="flex items-center gap-3">
                    <Download className="h-6 w-6 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">One-click install</p>
                      <p className="text-sm text-muted-foreground">Add HavocSMP to your device now.</p>
                    </div>
                  </div>
                  <Button size="lg" onClick={handleInstall} className="glow">
                    <Download className="h-4 w-4" /> Install app
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Apple className="h-5 w-5" /> iPhone / iPad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Step n={1} icon={<Share className="h-4 w-4" />}>
                    Open this page in <b>Safari</b> and tap the <b>Share</b> button.
                  </Step>
                  <Step n={2} icon={<Plus className="h-4 w-4" />}>
                    Scroll down and tap <b>Add to Home Screen</b>.
                  </Step>
                  <Step n={3} icon={<CheckCircle2 className="h-4 w-4" />}>
                    Tap <b>Add</b> — HavocSMP will appear on your home screen.
                  </Step>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-5 w-5" /> Android / Desktop
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Step n={1} icon={<Share className="h-4 w-4" />}>
                    Open the browser menu (⋮ in Chrome / Edge).
                  </Step>
                  <Step n={2} icon={<Plus className="h-4 w-4" />}>
                    Tap <b>Install app</b> or <b>Add to Home Screen</b>.
                  </Step>
                  <Step n={3} icon={<CheckCircle2 className="h-4 w-4" />}>
                    Confirm to install. Launch it like any other app.
                  </Step>
                </CardContent>
              </Card>
            </div>

            {ios && (
              <p className="text-xs text-muted-foreground text-center mt-6">
                iOS only supports installing from Safari. If you're in another browser, open this page in Safari first.
              </p>
            )}
          </>
        )}
      </main>
    </>
  );
}

function Step({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
        {n}
      </div>
      <div className="flex items-center gap-2 text-foreground/90">
        <span className="text-muted-foreground">{icon}</span>
        <span>{children}</span>
      </div>
    </div>
  );
}
