import { useEffect, useRef } from "react";

const MouseTrail = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    let last = 0;
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - last < 35) return;
      last = now;
      const dot = document.createElement("span");
      dot.className = "pointer-events-none fixed z-[9999] rounded-full";
      const size = 8 + Math.random() * 8;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${e.clientX - size / 2}px`;
      dot.style.top = `${e.clientY - size / 2}px`;
      dot.style.background = "radial-gradient(circle, hsl(24 100% 60% / 0.9), hsl(14 100% 55% / 0.4) 60%, transparent 70%)";
      dot.style.transition = "opacity 700ms ease, transform 700ms ease";
      dot.style.opacity = "1";
      container.appendChild(dot);
      requestAnimationFrame(() => {
        dot.style.opacity = "0";
        dot.style.transform = `translateY(-30px) scale(0.4)`;
      });
      setTimeout(() => dot.remove(), 750);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[9999]" />;
};

export default MouseTrail;
