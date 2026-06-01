import DiscoverComingSoon from "@/components/site/DiscoverComingSoon";

const Shaders = () => (
  <DiscoverComingSoon
    title="Shaders"
    searchPlaceholder="Search shaders..."
    sections={[
      { title: "Category", items: ["Cartoon", "Cursed", "Fantasy", "Realistic", "Semi Realistic", "Vanilla Like"] },
      { title: "Feature", items: ["Atmosphere", "Bloom", "Colored Lighting", "Foliage", "Path Tracing", "PBR", "Reflections", "Shadows"] },
      { title: "Performance impact", items: ["Potato", "Low", "Medium", "High", "Screenshot"] },
      { title: "Loader", items: ["Iris", "OptiFine", "Vanilla Shader"] },
    ]}
  />
);

export default Shaders;
