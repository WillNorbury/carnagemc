import DiscoverItemsBrowse from "@/components/site/DiscoverItemsBrowse";

const Modpacks = () => (
  <DiscoverItemsBrowse
    kind="modpack"
    title="Modpacks"
    searchPlaceholder="Search modpacks..."
    filterGroups={[
      {
        title: "Category",
        options: [
          "Adventure", "Challenging", "Combat", "Kitchen Sink", "Lightweight",
          "Magic", "Multiplayer", "Optimization", "Quests", "Technology",
        ],
      },
      { title: "Environment", options: ["Client", "Server"] },
      {
        title: "Game version",
        options: ["1.21.11", "1.21.10", "1.21.9", "1.21.8", "1.20", "1.19"],
      },
      { title: "Loader", options: ["Fabric", "Forge", "NeoForge"] },
    ]}
  />
);

export default Modpacks;
