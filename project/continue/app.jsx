/* ============ Continue? — app / state machine ============ */
const { useState: uS, useEffect: uE, useRef: uR, useCallback: uC } = React;

const DATA = window.CONTINUE_DATA;
const ROUND_MS = 8000;

function computeVerdict(score, total, owned) {
  const wipes = owned;
  if (score === total) {
    return `<span class="ok">Flawless.</span> You read every line under the clock. Either you've been burned before, or you don't blink.`;
  }
  if (owned === 0 && score >= total - 1) {
    return `<span class="ok">Sharp.</span> A couple of jumpy denials, but nothing dangerous got through. This is the job.`;
  }
  if (owned === 0) {
    return `Cautious to a fault — you denied some harmless ones, but <span class="ok">nothing hit your machine.</span>`;
  }
  if (owned === 1) {
    return `Decent reflexes — <span class="hit">but you let one trap run.</span> Once is all it takes.`;
  }
  if (score >= Math.ceil(total / 2)) {
    return `You caught most of them <span class="hit">but got owned ${wipes}×.</span> Prod is gone and the secrets are out there.`;
  }
  return `<span class="hit">You approved your way into a full incident review.</span> Owned ${wipes}× in under two minutes. This is why we read the command.`;
}

function App() {
  const [phase, setPhase] = uS("title");        // title | play | reveal | score
  const [index, setIndex] = uS(0);
  const [results, setResults] = uS([]);          // bool[] correctness per round
  const [score, setScore] = uS(0);
  const [owned, setOwned] = uS(0);
  const [missed, setMissed] = uS([]);            // trap items the player failed
  const [last, setLast] = uS(null);              // { decision, correct }
  const [flash, setFlash] = uS(0);
  const [shared, setShared] = uS(false);

  const lockRef = uR(false);                     // prevent double-resolve per round
  const item = DATA[index];

  /* reset lock each new round */
  uE(() => { lockRef.current = false; }, [index, phase]);

  const resolve = uC((decision) => {
    if (lockRef.current) return;
    lockRef.current = true;

    const it = DATA[index];
    const approvedish = decision === "approve" || decision === "timeout";
    const correct = decision !== "timeout" &&
      ((it.safe && decision === "approve") || (!it.safe && decision === "deny"));
    const gotOwned = approvedish && !it.safe;

    setLast({ decision, correct, owned: gotOwned });
    setResults((r) => [...r, correct]);
    if (correct) setScore((s) => s + 1);
    if (gotOwned) {
      setOwned((o) => o + 1);
      setFlash((f) => f + 1);
    }
    if (!it.safe && !correct) setMissed((m) => [...m, it]);

    setPhase("reveal");
  }, [index]);

  const next = uC(() => {
    if (index + 1 < DATA.length) {
      setIndex((i) => i + 1);
      setPhase("play");
    } else {
      setPhase("score");
    }
  }, [index]);

  const start = uC(() => {
    setIndex(0); setResults([]); setScore(0); setOwned(0);
    setMissed([]); setLast(null); setShared(false);
    setPhase("play");
  }, []);

  /* keyboard */
  uE(() => {
    const onKey = (e) => {
      if (phase === "title") {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); }
      } else if (phase === "play") {
        if (e.key === "1") { e.preventDefault(); resolve("approve"); }
        else if (e.key === "2") { e.preventDefault(); resolve("deny"); }
      } else if (phase === "reveal") {
        if (e.key === "Enter" || e.key === " " || e.key === "n") { e.preventDefault(); next(); }
      } else if (phase === "score") {
        if (e.key === "Enter") { e.preventDefault(); start(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, resolve, next, start]);

  /* share */
  const share = uC(() => {
    const sneaky = [...missed].sort((a, b) => b.sneaky - a.sneaky)[0];
    const lines = [
      `CONTINUE? — I scored ${score}/${DATA.length} approving AI agent commands.`,
      owned > 0 ? `Got owned ${owned}×.` : `Didn't get owned once.`,
      sneaky ? `Sneakiest one I missed: > ${sneaky.command}` : null,
      `Think you'd catch them? ${location.href}`
    ].filter(Boolean);
    const text = lines.join("\n");
    const done = () => { setShared(true); setTimeout(() => setShared(false), 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(done);
    } else { done(); }
  }, [score, owned, missed]);

  const sneakiest = [...missed].sort((a, b) => b.sneaky - a.sneaky)[0] || null;

  return (
    <div className="shell stage-flicker">
      <CRT />
      {flash > 0 && <div key={flash} className="owned-flash go" />}

      {phase === "title" && <TitleScreen onStart={start} />}

      {phase === "play" && (
        <GameRound
          item={item}
          index={index}
          total={DATA.length}
          score={score}
          results={results}
          duration={ROUND_MS}
          onResolve={resolve}
        />
      )}

      {phase === "reveal" && last && (
        <RevealCard
          item={item}
          decision={last.decision}
          correct={last.correct}
          owned={last.owned}
          onNext={next}
          index={index}
          total={DATA.length}
          results={results}
        />
      )}

      {phase === "score" && (
        <ScoreCard
          score={score}
          total={DATA.length}
          owned={owned}
          sneakiest={sneakiest}
          verdict={computeVerdict(score, DATA.length, owned)}
          onReplay={start}
          onShare={share}
          shared={shared}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
