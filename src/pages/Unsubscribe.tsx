import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

export default function Unsubscribe() {
  return (
    <main className="container mx-auto p-6 max-w-md">
      <Helmet>
        <title>Email preferences — CarnageMC</title>
        <meta
          name="description"
          content="Manage your CarnageMC email preferences and unsubscribe options."
        />
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle>Email preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground flex items-start gap-2">
            <Mail className="h-5 w-5 shrink-0 mt-0.5" />
            <span>
              Unsubscribing is now handled directly from the unsubscribe link at the
              bottom of any CarnageMC email — one click and you're opted out, no
              account needed.
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Can't find an email? Contact us and we'll remove your address for you.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/contact">Contact support</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
