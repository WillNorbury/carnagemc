import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export const LiveClock = ({ className = "" }: { className?: string }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border bg-card/60 px-2.5 py-1 text-xs text-muted-foreground ${className}`}
      title={tz}
    >
      <Clock className="h-3.5 w-3.5 text-primary" />
      <span className="font-mono tabular-nums text-foreground">{time}</span>
      <span className="hidden sm:inline">· {date}</span>
    </div>
  );
};
