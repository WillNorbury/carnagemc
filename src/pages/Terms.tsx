import LegalPage, { type LegalDoc } from "@/components/site/LegalPage";

const doc: LegalDoc = {
  path: "/terms",
  eyebrow: "Legal",
  title: "Terms of",
  highlight: "Service",
  intro:
    "The rules of the agreement between you and CarnageMC when you use our website, servers, Discord, or store.",
  seoDescription:
    "CarnageMC terms of service — account rules, acceptable use, purchases, moderation, liability, and termination for our Minecraft network.",
  updated: "29 July 2026",
  sections: [
    {
      id: "acceptance",
      heading: "1. Acceptance of terms",
      body: [
        "By accessing the CarnageMC website, connecting to our Minecraft servers, joining our Discord, or purchasing from our store, you agree to these terms.",
        "If you are under the age of majority where you live, you may only use CarnageMC with the permission of a parent or guardian.",
      ],
    },
    {
      id: "accounts",
      heading: "2. Accounts",
      body: [
        "You are responsible for everything that happens on your account, including actions taken by anyone you share access with. Keep your credentials private.",
        "You may not create accounts to evade a ban, impersonate staff or other players, or hold accounts on behalf of banned users.",
        "We may suspend or delete accounts that are inactive, fraudulent, or in breach of these terms.",
      ],
    },
    {
      id: "conduct",
      heading: "3. Acceptable use",
      body: [
        "Our in-game and Discord rules form part of these terms. Cheating, exploiting, harassment, hate speech, doxxing, advertising, and threats against the network or its players are prohibited.",
        "You may not attempt to disrupt, overload, reverse engineer, or gain unauthorised access to any part of our infrastructure.",
        "Content you upload — screenshots, plugins, Skripts, server listings, reviews, applications — must be yours to share and must not be illegal, malicious, or infringing.",
      ],
    },
    {
      id: "content",
      heading: "4. Your content and our content",
      body: [
        "You keep ownership of content you upload. By uploading it you grant CarnageMC a non-exclusive licence to host, display, and distribute it on our platform.",
        "CarnageMC branding, builds, configurations, and custom systems remain our property. You may not redistribute them without permission.",
        "Minecraft is a trademark of Mojang Studios. CarnageMC is not affiliated with, endorsed by, or associated with Mojang Studios or Microsoft.",
      ],
    },
    {
      id: "purchases",
      heading: "5. Purchases and virtual items",
      body: [
        "All store purchases are donations that support server costs, in exchange for optional cosmetic and convenience perks.",
        "Ranks, keys, coins, and other virtual items are licences to use features on our servers. They have no real-world value, cannot be transferred or sold, and do not survive the closure of the network.",
        "Chargebacks made without first contacting us result in a permanent store and network ban.",
      ],
    },
    {
      id: "moderation",
      heading: "6. Moderation and enforcement",
      body: [
        "Staff may warn, mute, kick, ban, roll back, or remove content at their discretion to protect the community.",
        "Punishments can be appealed once through the appeals system. Appeal outcomes are final.",
        "Purchases do not exempt any player from moderation, and punishments are not refundable.",
      ],
    },
    {
      id: "availability",
      heading: "7. Availability",
      body: [
        "We aim for high uptime but provide the service on an \"as is\" and \"as available\" basis. Maintenance, resets, seasonal wipes, and outages will happen.",
        "We may add, change, or remove game modes and features at any time.",
      ],
    },
    {
      id: "liability",
      heading: "8. Limitation of liability",
      body: [
        "To the fullest extent permitted by law, CarnageMC is not liable for lost in-game items, lost progress, service interruptions, or indirect or consequential damages.",
        "Where liability cannot be excluded, it is limited to the amount you paid us in the twelve months before the claim.",
      ],
    },
    {
      id: "termination",
      heading: "9. Termination and changes",
      body: [
        "You may stop using CarnageMC at any time and request account deletion via a support ticket.",
        "We may update these terms as the network changes. Continued use after an update means you accept the revised terms.",
      ],
    },
  ],
};

const Terms = () => <LegalPage doc={doc} />;
export default Terms;
