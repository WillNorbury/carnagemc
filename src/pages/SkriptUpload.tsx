import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileCode } from "lucide-react";
import SkriptUploadForm from "@/components/dashboard/SkriptUploadForm";

const SkriptUpload = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Upload Skript — CarnageMC";
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?next=/discover/skripts/new", { replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to="/discover/skripts">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Skripts
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard#create-skript">Use Dashboard version</Link>
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <FileCode className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl">Upload a Skript</h1>
            <p className="text-sm text-muted-foreground">
              Publish a <code className="text-foreground">.sk</code> file to the marketplace.
            </p>
          </div>
        </div>

        <Card className="p-6">
          <SkriptUploadForm successHref="/discover/skripts" />
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SkriptUpload;
