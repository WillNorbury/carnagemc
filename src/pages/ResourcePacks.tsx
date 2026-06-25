import DiscoverItemsBrowse from "@/components/site/DiscoverItemsBrowse";

const ResourcePacks = () => (
  <DiscoverItemsBrowse
    kind="resource_pack"
    title="Resource Packs"
    searchPlaceholder="Search resource packs..."
    filterGroups={[
      {
        title: "Category",
        options: [
          "Combat", "Cursed", "Decoration", "Modded", "Realistic",
          "Simplistic", "Themed", "Tweaks", "Utility", "Vanilla Like",
        ],
      },
      {
        title: "Feature",
        options: [
          "Audio", "Blocks", "Core Shaders", "Entities", "Environment",
          "Equipment", "Fonts", "GUI", "Items", "Locale", "Models",
        ],
      },
      {
        title: "Resolution",
        options: ["8x or lower", "16x", "32x", "48x", "64x", "128x", "256x"],
      },
      { title: "Pricing", options: ["Free", "Paid"] },
    ]}
  />
);

export default ResourcePacks;
