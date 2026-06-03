"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  duration: number;
  running: boolean;
  resetKey: string;
  onExpire: () => void;
}

export default function TimerBar({ duration, running, resetKey, onExpire }: Props) {
  const fillRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const firedRef = useRef(false);
  const [danger, setDanger] = useState(false);

  useEffect(() => {
    firedRef.current = false;
    setDanger(false);
    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const remain = Math.max(0, 1 - elapsed / duration);
      if (fillRef.current) fillRef.current.style.width = remain * 100 + "%";
      if (headRef.current) headRef.current.style.left = remain * 100 + "%";
      if (remain < 0.34) setDanger(true);
      if (remain <= 0) {
        if (!firedRef.current) { firedRef.current = true; onExpire(); }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (running) rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [resetKey, running, duration, onExpire]);

  return (
    <div className={"timer" + (danger ? " danger" : "")}>
      <div ref={fillRef} className="timer-fill" style={{ width: "100%" }} />
      <div ref={headRef} className="timer-head" style={{ left: "100%" }} />
    </div>
  );
}
