/* ============ Continue? — shared components ============ */
const { useState, useEffect, useRef, useCallback } = React;

/* CRT overlay + grain (decorative, fixed) */
function CRT() {
  return (
    <React.Fragment>
      <div className="crt-grain" />
      <div className="crt-overlay" />
    </React.Fragment>
  );
}

/* Glitchy outlined CONTINUE? banner */
function GlitchTitle({ text }) {
  return (
    <h1 className="glitch-title" data-text={text}>
      <span className="fill">{text}</span>
    </h1>
  );
}

/* Alarm / warning glyph (simple, allowed: triangle + bang) */
function AlarmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 L22 20 H2 Z" />
      <line x1="12" y1="10" x2="12" y2="14.5" />
      <circle cx="12" cy="17.4" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* Danger tier badge */
function TierBadge({ tier }) {
  return <span className={"tier " + tier}>{tier}</span>;
}

/*
  Draining timer bar — rAF driven so the parent can react to timeout.
  props: duration(ms), running, onExpire, resetKey
*/
function TimerBar({ duration, running, onExpire, resetKey }) {
  const fillRef = useRef(null);
  const headRef = useRef(null);
  const wrapRef = useRef(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const firedRef = useRef(false);
  const [danger, setDanger] = useState(false);

  useEffect(() => {
    firedRef.current = false;
    setDanger(false);
    startRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const remain = Math.max(0, 1 - elapsed / duration);
      if (fillRef.current) fillRef.current.style.width = (remain * 100) + "%";
      if (headRef.current) headRef.current.style.left = (remain * 100) + "%";
      if (remain < 0.34 && !danger) setDanger(true);
      if (remain <= 0) {
        if (!firedRef.current) {
          firedRef.current = true;
          onExpire && onExpire();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    if (running) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line
  }, [resetKey, running, duration]);

  return (
    <div ref={wrapRef} className={"timer" + (danger ? " danger" : "")}>
      <div ref={fillRef} className="timer-fill" style={{ width: "100%" }} />
      <div ref={headRef} className="timer-head" style={{ left: "100%" }} />
    </div>
  );
}

Object.assign(window, { CRT, GlitchTitle, AlarmIcon, TierBadge, TimerBar });
