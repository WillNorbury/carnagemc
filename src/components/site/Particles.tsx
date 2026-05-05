import { useMemo } from "react";

interface Props {
  count?: number;
  className?: string;
}

const Particles = ({ count = 30, className = "" }: Props) => {
  const embers = useMemo(() => Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const dx = (Math.random() - 0.5) * 200;
    const duration = 8 + Math.random() * 12;
    const delay = -Math.random() * duration;
    const size = 2 + Math.random() * 5;
    const opacity = 0.4 + Math.random() * 0.6;
    return { i, left, dx, duration, delay, size, opacity };
  }), [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      {embers.map((e) => (
        <span
          key={e.i}
          className="ember"
          style={{
            left: `${e.left}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            opacity: e.opacity,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
            ['--dx' as any]: `${e.dx}px`,
          }}
        />
      ))}
    </div>
  );
};

export default Particles;
