import { useEffect, useState } from "react";

interface Props {
  target: number; // ms epoch
  label?: string;
}

const pad = (n: number) => n.toString().padStart(2, "0");

const Countdown = ({ target, label = "Next event" }: Props) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const Cell = ({ v, l }: { v: number | string; l: string }) => (
    <div className="flex flex-col items-center">
      <div className="font-display text-2xl md:text-4xl font-bold text-gradient min-w-[3ch] text-center">
        {typeof v === "number" ? pad(v) : v}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{l}</div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs uppercase tracking-[0.25em] text-primary">{label}</div>
      <div className="flex items-center gap-3 md:gap-5">
        <Cell v={d} l="Days" />
        <span className="text-primary text-2xl">:</span>
        <Cell v={h} l="Hrs" />
        <span className="text-primary text-2xl">:</span>
        <Cell v={m} l="Min" />
        <span className="text-primary text-2xl">:</span>
        <Cell v={s} l="Sec" />
      </div>
    </div>
  );
};

export default Countdown;
