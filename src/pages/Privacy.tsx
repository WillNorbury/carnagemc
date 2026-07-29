import LegalPage, { type LegalDoc } from "@/components/site/LegalPage";

const doc: LegalDoc = {
  path: "/privacy",
  eyebrow: "Legal",
  title: "Privacy",
  highlight: "Policy",
  intro:
    "How CarnageMC collects, uses, and protects your information across our website, Discord, and Minecraft servers.",
  seoDescription:
    "CarnageMC privacy policy — what data we collect on the website and game servers, how it is used, how long it is kept, and how to request deletion.",
  updated: "29 July 2026",
  sections: [
    {
      id: "overview",
      heading: "1. Overview",
      body: [
        "This policy explains what information CarnageMC (\"we\", \"us\") collects when you use our website, our Minecraft servers, or our Discord community, and what we do with it.",
        "By creating an account, joining a server, or purchasing from our store, you agree to the practices described here. If you do not agree, please do not use our services.",
      ],
    },
    {
      id: "collect",
      heading: "2. Information we collect",
      body: [
        "Account information: the email address you register with, your display name, avatar, and any Minecraft username or Discord account you choose to link.",
        "Gameplay information: your Minecraft UUID and username, connection times, in-game statistics, chat logs, and moderation records such as warnings, mutes, and bans.",
        "Support information: the content of tickets, ban appeals, applications, contact messages, and reports you submit to us.",
        "Technical information: IP address, browser type, and device information captured in server logs for security, anti-abuse, and uptime monitoring.",
        "Purchase information: the packages you buy and the order records we hold. Card and payment details are handled entirely by our payment processor and are never stored on our systems.",
      ],
    },
    {
      id: "use",
      heading: "3. How we use your information",
      body: [
        "To operate the network: authenticate you, deliver purchased ranks and items, run leaderboards, and keep servers online.",
        "To moderate: enforce our rules, investigate reports, prevent cheating and ban evasion, and review appeals.",
        "To communicate: send transactional emails such as order confirmations, ticket replies, application outcomes, and — only if you opt in — announcements and status alerts.",
        "To improve: understand which features and game modes are used so we can prioritise development.",
        "We do not sell your personal information, and we do not use it for third-party advertising.",
      ],
    },
    {
      id: "sharing",
      heading: "4. Sharing and third parties",
      body: [
        "We share data only with the service providers required to run CarnageMC: our hosting and database provider, our email delivery provider, our payment processor, and Discord where you have linked your account.",
        "We may disclose information where legally required, or where necessary to protect the safety of our players and staff.",
      ],
    },
    {
      id: "retention",
      heading: "5. Data retention",
      body: [
        "Account and profile data is kept while your account exists. Moderation records, including bans and appeals, may be kept indefinitely so that we can enforce sanctions consistently.",
        "Order records are kept as long as needed for accounting and dispute resolution. Server and uptime logs are rotated on a rolling basis.",
      ],
    },
    {
      id: "rights",
      heading: "6. Your rights and choices",
      body: [
        "You can view and edit your profile at any time from your account settings, and unlink Discord whenever you wish.",
        "You can unsubscribe from announcement and status emails using the link in any message, or from your account preferences. Transactional emails relating to purchases and tickets cannot be disabled.",
        "You can request a copy of your data, correction of inaccurate data, or deletion of your account by opening a support ticket. Deletion does not remove moderation records tied to your Minecraft account.",
      ],
    },
    {
      id: "children",
      heading: "7. Children",
      body: [
        "CarnageMC is not directed at children under 13. If you believe a child under 13 has provided us with personal information, contact us and we will remove it.",
      ],
    },
    {
      id: "security",
      heading: "8. Security",
      body: [
        "Access to player data is restricted to staff who need it, protected by row-level database security and role-based permissions. Passwords are hashed and never visible to staff.",
        "No system is perfectly secure. If we become aware of a breach affecting your data, we will notify affected users.",
      ],
    },
    {
      id: "changes",
      heading: "9. Changes and contact",
      body: [
        "We may update this policy as the network evolves. Material changes will be announced on the site.",
        "For any privacy question, open a support ticket or use the contact form on our website.",
      ],
    },
  ],
};

const Privacy = () => <LegalPage doc={doc} />;
export default Privacy;
