import DiscoverComingSoon from "@/components/site/DiscoverComingSoon";

const ResourcePacks = () => (
  <DiscoverComingSoon
    title="Resource Packs"
    searchPlaceholder="Search resource packs..."
    sections={[
      { title: "Category", items: ["Combat", "Cursed", "Decoration", "Modded", "Realistic", "Simplistic", "Themed", "Tweaks", "Utility", "Vanilla Like"] },
      { title: "Feature", items: ["Audio", "Blocks", "Core Shaders", "Entities", "Environment", "Equipment", "Fonts", "GUI", "Items", "Locale", "Models"] },
      { title: "Resolution", items: ["8x or lower", "16x", "32x", "48x", "64x", "128x", "256x"] },
    ]}
  />
);

export default ResourcePacks;
