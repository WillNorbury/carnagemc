import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Database, Cookie, UserCheck, Mail, AlertTriangle, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    icon: UserCheck,
    title: "Access & Authentication",
    body: "Accounts are protected with email/password sign-in, optional Discord OAuth, and optional two-factor authentication on user profiles. Administrative actions are gated behind server-side role checks; client-supplied role claims are never trusted.",
  },
  {
    icon: Shield,
    title: "Platform & Hosting",
    body: "CarnageMC is built on Lovable Cloud, which uses Supabase for managed Postgres, authentication, storage, and edge functions. Row-Level Security is enabled across user-facing tables so each request only returns rows the caller is authorized to see. This is not an independent certification of the underlying platform.",
  },
  {
    icon: Database,
    title: "Data We Collect & How It's Used",
    body: "We store the account details you provide (email, display name, optional Minecraft username, optional linked Discord identity), in-app activity needed to operate features (votes, streaks, tickets, applications, appeals), and content you publish on the site. Data is used to run the service and is not sold.",
  },
  {
    icon: Lock,
    title: "Subprocessors & Integrations",
    body: "Authentication, database, storage, and serverless functions are provided by Supabase via Lovable Cloud. Transactional email is sent through our configured email provider. Discord is used for optional account linking, bot interactions, and invites. Each integration only receives the data required to perform its function.",
  },
  {
    icon: Cookie,
    title: "Cookies & Analytics",
    body: "We use cookies and local storage for session management, theme preferences, and basic in-app analytics that help us understand which pages and features are used. We do not run third-party advertising trackers.",
  },
  {
    icon: FileText,
    title: "Retention & Deletion",
    body: "Account data is retained for as long as your account is active. Signed-in users can update their profile from the Profile page. To request account deletion, contact us through the support channels below and a staff member will action your request.",
  },
  {
    icon: AlertTriangle,
    title: "Incident & Vulnerability Reporting",
    body: "If you believe you have found a security vulnerability or want to report a suspected incident, please contact the staff team privately rather than disclosing publicly. We will acknowledge reports and investigate as quickly as possible.",
  },
  {
    icon: Mail,
    title: "Contact",
    body: "For privacy, security, or data questions, reach out through the Contact page or open a support ticket. A member of staff will respond.",
  },
];

export default function Trust() {
  return (
    <main className="container mx-auto px-4 py-10 max-w-4xl">
      <Helmet>
        <title>Trust & Security · CarnageMC</title>
        <meta
          name="description"
          content="How CarnageMC handles security, privacy, data, and integrations."
        />
      </Helmet>

      <header className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-wider mb-3">
          TRUST & <span className="text-gradient">SECURITY</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          This page is maintained by the CarnageMC team to answer common security and privacy
          questions about the site. It describes practices and controls that are currently in
          place — it is not an independent certification or audit.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="border-primary/20">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              {body}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-10 rounded-lg border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
        <h2 className="font-semibold text-foreground mb-2">Shared responsibility</h2>
        <p>
          CarnageMC operates the application and configures access controls, integrations, and
          content. The underlying cloud platform provides managed infrastructure, database, and
          authentication primitives. You are responsible for keeping your account credentials
          secure, choosing a strong password, and reporting suspected misuse to staff.
        </p>
        <p className="mt-3">
          Have a question that isn't answered here?{" "}
          <Link to="/contact" className="text-primary underline-offset-4 hover:underline">
            Contact us
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
