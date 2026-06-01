import DiscoverComingSoon from "@/components/site/DiscoverComingSoon";

const Modpacks = () => (
  <DiscoverComingSoon
    title="Modpacks"
    searchPlaceholder="Search modpacks..."
    sections={[
      { title: "Category", items: ["Adventure", "Challenging", "Combat", "Kitchen Sink", "Lightweight", "Magic", "Multiplayer", "Optimization", "Quests", "Technology"] },
      { title: "Environment", items: ["Client", "Server"] },
      { title: "Game version", items: ["1.21.11", "1.21.10", "1.21.9", "1.21.8", "1.20", "1.19"] },
      { title: "Loader", items: ["Fabric", "Forge", "NeoForge"] },
    ]}
  />
);

export default Modpacks;
