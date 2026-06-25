import DiscoverItemsBrowse from "@/components/site/DiscoverItemsBrowse";

const Shaders = () => (
  <DiscoverItemsBrowse
    kind="shader"
    title="Shaders"
    searchPlaceholder="Search shaders..."
    filterGroups={[
      {
        title: "Category",
        options: ["Cartoon", "Cursed", "Fantasy", "Realistic", "Semi Realistic", "Vanilla Like"],
      },
      {
        title: "Feature",
        options: [
          "Atmosphere", "Bloom", "Colored Lighting", "Foliage",
          "Path Tracing", "PBR", "Reflections", "Shadows",
        ],
      },
      {
        title: "Performance impact",
        options: ["Potato", "Low", "Medium", "High", "Screenshot"],
      },
      { title: "Loader", options: ["Iris", "OptiFine", "Vanilla Shader"] },
      { title: "Pricing", options: ["Free", "Paid"] },
    ]}
  />
);

export default Shaders;
