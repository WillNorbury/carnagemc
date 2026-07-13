import { useEffect } from "react";

const Discord = () => {
  useEffect(() => {
    window.location.replace("https://discord.carnagemc.net");
  }, []);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-muted-foreground">Redirecting to Discord...</p>
    </div>
  );
};

export default Discord;
