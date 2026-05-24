import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Enables an edge-swipe gesture: swipe right from the left edge of the screen
 * to open the mobile sidebar. Useful so users don't need to navigate back.
 */
export function SwipeToOpenSidebar() {
  const { isMobile, setOpenMobile, openMobile } = useSidebar();

  useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let tracking = false;

    const EDGE = 24; // px from left edge to start tracking
    const THRESHOLD = 60; // min horizontal distance
    const MAX_OFF_AXIS = 40; // max vertical drift
    const MAX_TIME = 600; // ms

    const onTouchStart = (e: TouchEvent) => {
      if (openMobile) return;
      const t = e.touches[0];
      if (!t) return;
      if (t.clientX > EDGE) return;
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
      tracking = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      const dt = Date.now() - startTime;
      if (dx > THRESHOLD && dy < MAX_OFF_AXIS && dt < MAX_TIME) {
        setOpenMobile(true);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, openMobile, setOpenMobile]);

  return null;
}
