import DiscoverItemsBrowse from "@/components/site/DiscoverItemsBrowse";

const Skripts = () => (
  <DiscoverItemsBrowse
    kind="skript"
    title="Skripts"
    searchPlaceholder="Search skripts (.sk)..."
    createHref="/discover/skripts/new"
    createLabel="Upload skript"
    filterGroups={[
      {
        title: "Category",
        options: [
          "Economy", "Minigames", "Mechanics", "Utility", "Admin Tools",
          "Chat", "Cosmetic", "PvP", "World", "Misc",
        ],
      },
      {
        title: "Skript Version",
        options: ["2.6", "2.7", "2.8", "2.9", "2.10"],
      },
      {
        title: "Addon",
        options: [
          "SkBee", "Skript-reflect", "skript-yaml", "skript-mirror",
          "skript-placeholders", "TuSKe", "skUtilities", "skript-gui",
        ],
      },
      {
        title: "Pricing",
        options: ["Free", "Paid"],
      },
    ]}
  />
);

export default Skripts;
