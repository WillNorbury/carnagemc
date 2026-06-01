import DiscoverComingSoon from "@/components/site/DiscoverComingSoon";

const Servers = () => (
  <DiscoverComingSoon
    title="Servers"
    searchPlaceholder="Search servers..."
    sections={[
      { title: "Type", items: ["Vanilla", "Modded"] },
      { title: "Features", items: ["Pokémon", "Bosses", "Classes", "Custom Content", "Dungeons", "Economy", "Media", "OP", "Personal Worlds", "Plots", "PvE", "PvP", "Questing", "Teams"] },
      { title: "Gameplay", items: ["Anarchy", "Battle Royale", "Bed Wars", "Factions", "Gens", "Kit PvP", "Lifesteal", "Microgames", "Minigames", "One Block", "Parkour", "Prison"] },
    ]}
  />
);

export default Servers;
