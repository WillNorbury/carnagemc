import DiscoverItemsBrowse from "@/components/site/DiscoverItemsBrowse";

const Servers = () => (
  <DiscoverItemsBrowse
    kind="server"
    title="Servers"
    searchPlaceholder="Search servers..."
    filterGroups={[
      { title: "Type", options: ["Vanilla", "Modded"] },
      {
        title: "Features",
        options: [
          "Pokémon", "Bosses", "Classes", "Custom Content", "Dungeons",
          "Economy", "Media", "OP", "Personal Worlds", "Plots",
          "PvE", "PvP", "Questing", "Teams",
        ],
      },
      {
        title: "Gameplay",
        options: [
          "Anarchy", "Battle Royale", "Bed Wars", "Factions", "Gens",
          "Kit PvP", "Lifesteal", "Microgames", "Minigames", "One Block",
          "Parkour", "Prison",
        ],
      },
    ]}
  />
);

export default Servers;
