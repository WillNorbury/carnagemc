import DiscoverComingSoon from "@/components/site/DiscoverComingSoon";

const DataPacks = () => (
  <DiscoverComingSoon
    title="Data Packs"
    searchPlaceholder="Search data packs..."
    sections={[
      { title: "Category", items: ["Adventure", "Cursed", "Decoration", "Economy", "Equipment", "Food", "Game Mechanics", "Library", "Magic", "Management", "Minigame", "Mobs", "Optimization", "Social", "Storage", "Technology", "Transportation", "Utility", "World Generation"] },
      { title: "Game version", items: ["1.21.11", "1.21.10", "1.21.9", "1.21.8", "1.20", "1.19"] },
    ]}
  />
);

export default DataPacks;
