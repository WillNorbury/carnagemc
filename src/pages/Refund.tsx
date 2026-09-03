import LegalPage, { type LegalDoc } from "@/components/site/LegalPage";

const doc: LegalDoc = {
  path: "/refund",
  eyebrow: "Legal",
  title: "Refund",
  highlight: "Policy",
  intro:
    "When a Warden Network store purchase can be refunded, how to request one, and what happens if you file a chargeback instead.",
  seoDescription:
    "Warden Network refund policy — eligibility, how to request a refund for ranks, keys, coins and bundles, delivery issues, and our chargeback rules.",
  updated: "29 July 2026",
  sections: [
    {
      id: "summary",
      heading: "1. The short version",
      body: [
        "Store purchases support the running costs of the network and are generally final once the item has been delivered to your account.",
        "If something went wrong — you were charged twice, your rank never arrived, or you bought the wrong package by mistake — contact us and we will make it right.",
      ],
    },
    {
      id: "eligible",
      heading: "2. When we do refund",
      body: [
        "Duplicate or accidental double charges.",
        "Items that were never delivered, where we are unable to deliver them manually.",
        "Purchases made within the last 48 hours where the item has not been used or consumed, and no rank perks have been exercised.",
        "Unauthorised purchases made on your payment method, once verified with our payment processor.",
      ],
    },
    {
      id: "not-eligible",
      heading: "3. When we do not refund",
      body: [
        "Items that have been used or consumed, including opened crate keys and spent coins.",
        "Purchases made more than 48 hours ago, unless there is a delivery failure on our side.",
        "Accounts that have been banned or punished for breaking the rules. Punishments are not a defect in the product.",
        "Season resets, world wipes, game mode closures, or changes to perks that form part of normal network operation.",
        "Gift purchases where the recipient has already redeemed the item.",
      ],
    },
    {
      id: "delivery",
      heading: "4. Delivery issues",
      body: [
        "Most purchases apply within a few minutes. If your rank or items have not arrived after 30 minutes, rejoin the server once — many perks apply on your next login.",
        "If it still has not arrived, open a support ticket with your order reference and Minecraft username and we will deliver it manually, usually within 24 hours.",
      ],
    },
    {
      id: "request",
      heading: "5. How to request a refund",
      body: [
        "Open a support ticket on this website with the subject \"Refund request\".",
        "Include your Minecraft username, the email used at checkout, the order reference, the package name, and a short description of the problem.",
        "We aim to respond within 72 hours. Approved refunds are returned to the original payment method and can take 5–10 business days to appear.",
      ],
    },
    {
      id: "chargebacks",
      heading: "6. Chargebacks",
      body: [
        "Please contact us before disputing a payment with your bank. Almost every issue can be resolved faster through a ticket.",
        "Filing a chargeback without contacting us first results in the immediate removal of all purchased items and a permanent ban from the network, the store, and our Discord.",
        "Bans issued for chargebacks are not appealable until the disputed amount has been settled.",
      ],
    },
    {
      id: "contact",
      heading: "7. Contact",
      body: [
        "For anything relating to billing or refunds, open a support ticket or use the contact form on this website. Do not share full card details with staff — we will never ask for them.",
      ],
    },
  ],
};

const Refund = () => <LegalPage doc={doc} />;
export default Refund;
