"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ROUNDS, shuffle, type Round } from "@/lib/game-data";
import TimerBar from "./TimerBar";

const ROUND_MS = 8000;

type Phase = "title" | "play" | "reveal" | "score";
type Decision = "approve" | "deny" | "timeout";

function computeVerdict(score: number, total: number, owned: number): string {
  if (score === total)
    return `<span class="ok">Flawless.</span> You read every line under the clock. Either you've been burned before, or you don't blink.`;
  if (owned === 0 && score >= total - 1)
    return `<span class="ok">Sharp.</span> A couple of jumpy denials, but nothing dangerous got through. This is the job.`;
  if (owned === 0)
    return `Cautious to a fault — you denied some harmless ones, but <span class="ok">nothing hit your machine.</span>`;
  if (owned === 1)
    return `Decent reflexes — <span class="hit">but you let one trap run.</span> Once is all it takes.`;
  if (score >= Math.ceil(total / 2))
    return `You caught most of them <span class="hit">but got owned ${owned}×.</span> Prod is gone and the secrets are out there.`;
  return `<span class="hit">You approved your way into a full incident review.</span> Owned ${owned}× in under two minutes. This is why we read the command.`;
}

/* ---- CRT overlay ---- */
function CRT() {
  return (
    <>
      <div className="crt-grain" />
      <div className="crt-overlay" />
    </>
  );
}

/* ---- Glitch banner ---- */
function GlitchTitle({ text }: { text: string }) {
  return (
    <h1 className="glitch-title" data-text={text}>
      <span className="fill">{text}</span>
    </h1>
  );
}

/* ---- Alarm icon ---- */
function AlarmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 L22 20 H2 Z" />
      <line x1="12" y1="10" x2="12" y2="14.5" />
      <circle cx="12" cy="17.4" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ---- Tier badge ---- */
function TierBadge({ tier }: { tier: string }) {
  return <span className={`tier ${tier}`}>{tier}</span>;
}

/* ---- HUD pips ---- */
function Hud({ total, index, results, score, showScore = true }: {
  total: number; index: number; results: boolean[]; score: number; showScore?: boolean;
}) {
  return (
    <div className="hud">
      <div className="pips">
        {Array.from({ length: total }).map((_, i) => {
          let cls = "pip";
          if (i < results.length) cls += results[i] ? " good" : " bad";
          else if (i === index) cls += " now";
          return <span key={i} className={cls} />;
        })}
      </div>
      <div className="score">
        ROUND <b>{index + 1}</b>/{total}
        {showScore && <> · SCORE <b>{score}</b></>}
      </div>
    </div>
  );
}

/* ---- Title screen ---- */
function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="frame fade-up" style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ textAlign: "center" }}>
        <div className="mono-label" style={{ marginBottom: 14 }}>// approval reflex test</div>
        <GlitchTitle text="CONTINUE?" />
      </div>

      <div className="notice">
        <div className="notice-icon"><AlarmIcon /></div>
        <div className="notice-body">
          <strong>1 MINUTE UNTIL YOUR NEXT MEETING.</strong> Your coding agent is finishing
          your refactor. It needs approval for a few shell commands. Your eyes are already
          glazing over and your cursor is hovering the green button. Read each one. Approve
          the safe, deny the trap — before the timer drains. Can you stay sharp?
        </div>
      </div>

      <button className="btn btn-primary btn-block" style={{ padding: "17px 22px" }} onClick={onStart}>
        START SESSION <span className="blink">▮</span>
      </button>

      <div style={{ display: "flex", justifyContent: "center", gap: 22, color: "var(--muted)", fontSize: 12, letterSpacing: "0.1em" }}>
        <span><b style={{ color: "var(--green)" }}>1</b> APPROVE</span>
        <span><b style={{ color: "var(--red)" }}>2</b> DENY</span>
        <span>10 COMMANDS · 8s EACH</span>
      </div>
    </div>
  );
}

/* ---- Gameplay round ---- */
function GameRound({ item, index, total, score, results, onResolve }: {
  item: Round; index: number; total: number; score: number;
  results: boolean[]; onResolve: (d: Decision) => void;
}) {
  return (
    <div className="frame">
      <Hud total={total} index={index} results={results} score={score} />

      <div className="term">
        <div className="term-titlebar">
          <div className="term-dots"><i/><i/><i/></div>
          <span>agent · zsh · ~/work/api</span>
          <div className="term-meta">
            <span className="hide-sm">PID 4417</span>
            <b>● live</b>
          </div>
        </div>

        <div className="term-body" key={item.id}>
          <div className="term-run">Run bash command</div>

          <div className="term-narration">
            {item.narration} <span className="caret blink">▌</span>
          </div>

          <div className="cmd-block cmd-typing">
            {item.comment && <div className="cmd-comment">{item.comment}</div>}
            <div className={"cmd-line" + (item.overflow ? " overflow" : "")}>
              <span className="prompt">&gt;</span>{item.command}
            </div>
          </div>
          {item.overflow && <div className="overflow-hint">→ scroll · line continues past edge</div>}

          <div className="term-proceed">Do you want to proceed?</div>

          <div className="choices">
            <button className="choice allow" onClick={() => onResolve("approve")}>
              <span className="key">1</span>
              <span className="arrow">›</span>
              <span>Yes, allow</span>
            </button>
            <button className="choice deny" onClick={() => onResolve("deny")}>
              <span className="key">2</span>
              <span className="arrow">›</span>
              <span>Deny</span>
            </button>
          </div>

          <TimerBar
            duration={ROUND_MS}
            running={true}
            resetKey={item.id}
            onExpire={() => onResolve("timeout")}
          />
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, letterSpacing: "0.14em", color: "var(--muted)" }}>
        PRESS <b style={{ color: "var(--text-dim)" }}>1</b> ALLOW · <b style={{ color: "var(--text-dim)" }}>2</b> DENY
      </div>
    </div>
  );
}

/* ---- Reveal card ---- */
function RevealCard({ item, decision, correct, onNext, index, total, results }: {
  item: Round; decision: Decision; correct: boolean;
  onNext: () => void; index: number; total: number; results: boolean[];
}) {
  const approved = decision === "approve";
  const timedOut = decision === "timeout";
  const didText = approved || timedOut ? item.didSafe : item.didDanger;

  let verdictText: string;
  if (timedOut) verdictText = "TIMED OUT — AUTO-RAN";
  else if (correct) verdictText = approved ? "SAFE — ALLOWED" : "TRAP — DENIED";
  else verdictText = approved ? "OWNED" : "FALSE ALARM";

  return (
    <div className="frame">
      <Hud total={total} index={index} results={results} score={0} showScore={false} />

      <div className="term reveal">
        <div className="term-titlebar">
          <div className="term-dots"><i/><i/><i/></div>
          <span>agent · zsh · ~/work/api</span>
          <div className="term-meta">
            <b style={{ color: correct ? "var(--green)" : "var(--red)" }}>
              {correct ? "● clear" : "● compromised"}
            </b>
          </div>
        </div>

        <div className="term-body">
          <div className="verdict-row">
            <span className={"verdict " + (correct ? "good" : "bad")}>{verdictText}</span>
            <TierBadge tier={item.tier} />
          </div>

          <div className="cmd-recall">
            <span className="prompt" style={{ color: "var(--muted)" }}>&gt; </span>{item.command}
          </div>

          <div className="did-label">What it actually did</div>
          <div className="did-text">{didText}</div>

          <button
            className="btn btn-block"
            onClick={onNext}
            style={correct
              ? { borderColor: "var(--green-dim)", color: "var(--green)" }
              : { borderColor: "var(--red-dim)", color: "var(--red)" }}
          >
            {index + 1 < total ? "NEXT COMMAND ›" : "SEE RESULTS ›"}
            <span className="mono-label" style={{ marginLeft: 8 }}>[ENTER]</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Score card ---- */
function ScoreCard({ score, total, owned, sneakiest, verdict, onReplay, onShare, shared }: {
  score: number; total: number; owned: number; sneakiest: Round | null;
  verdict: string; onReplay: () => void; onShare: () => void; shared: boolean;
}) {
  return (
    <div className="frame fade-up">
      <div className="scorecard">
        <div className="sc-top">
          <span className="sc-brand"><b>CONTINUE?</b> · approval reflex test</span>
          <span className="sc-brand">{new Date().toISOString().slice(0, 10)}</span>
        </div>

        <div className="sc-score">{score}<span className="denom">/{total}</span></div>
        <div className="sc-verdict" dangerouslySetInnerHTML={{ __html: verdict }} />

        <div className="sc-stats">
          <div className="sc-stat">
            <div className={"n " + (owned > 0 ? "red" : "green")}>{owned}×</div>
            <div className="l">Got owned</div>
          </div>
          <div className="sc-stat">
            <div className={"n " + (score >= total - 2 ? "green" : "red")}>{Math.round((score / total) * 100)}%</div>
            <div className="l">Caught</div>
          </div>
        </div>

        {sneakiest && (
          <div className="sc-sneaky">
            <div className="l">Sneakiest one you missed</div>
            <div className="c"><span className="prompt">&gt;</span>{sneakiest.command}</div>
          </div>
        )}
      </div>

      <div className="sc-actions" style={{ marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onShare}>{shared ? "COPIED ✓" : "SHARE"}</button>
        <button className="btn btn-primary" onClick={onReplay}>PLAY AGAIN</button>
      </div>
    </div>
  );
}

/* ---- App / state machine ---- */
export default function Game() {
  const [phase, setPhase] = useState<Phase>("title");
  const [index, setIndex] = useState(0);
  const [deck, setDeck] = useState<Round[]>(() => shuffle(ROUNDS));
  const [results, setResults] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const [owned, setOwned] = useState(0);
  const [missed, setMissed] = useState<Round[]>([]);
  const [last, setLast] = useState<{ decision: Decision; correct: boolean } | null>(null);
  const [flash, setFlash] = useState(0);
  const [shared, setShared] = useState(false);

  const lockRef = useRef(false);
  const item = deck[index];

  useEffect(() => { lockRef.current = false; }, [index, phase]);

  const resolve = useCallback((decision: Decision) => {
    if (lockRef.current) return;
    lockRef.current = true;

    const it = deck[index];
    const approvedish = decision === "approve" || decision === "timeout";
    const correct =
      decision !== "timeout" &&
      ((it.safe && decision === "approve") || (!it.safe && decision === "deny"));
    const gotOwned = approvedish && !it.safe;

    setLast({ decision, correct });
    setResults((r) => [...r, correct]);
    if (correct) setScore((s) => s + 1);
    if (gotOwned) { setOwned((o) => o + 1); setFlash((f) => f + 1); }
    if (!it.safe && !correct) setMissed((m) => [...m, it]);

    setPhase("reveal");
  }, [deck, index]);

  const next = useCallback(() => {
    if (index + 1 < deck.length) {
      setIndex((i) => i + 1);
      setPhase("play");
    } else {
      setPhase("score");
    }
  }, [deck.length, index]);

  const start = useCallback(() => {
    setDeck(shuffle(ROUNDS));
    setIndex(0); setResults([]); setScore(0); setOwned(0);
    setMissed([]); setLast(null); setShared(false);
    setPhase("play");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "title" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); start(); }
      else if (phase === "play" && e.key === "1") { e.preventDefault(); resolve("approve"); }
      else if (phase === "play" && e.key === "2") { e.preventDefault(); resolve("deny"); }
      else if (phase === "reveal" && (e.key === "Enter" || e.key === " " || e.key === "n")) { e.preventDefault(); next(); }
      else if (phase === "score" && e.key === "Enter") { e.preventDefault(); start(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, resolve, next, start]);

  const share = useCallback(() => {
    const sneaky = [...missed].sort((a, b) => b.sneaky - a.sneaky)[0];
    const lines = [
      `CONTINUE? — I scored ${score}/${ROUNDS.length} approving AI agent commands.`,
      owned > 0 ? `Got owned ${owned}×.` : `Didn't get owned once.`,
      sneaky ? `Sneakiest one I missed: > ${sneaky.command}` : null,
      `Think you'd catch them? ${window.location.href}`,
    ].filter(Boolean) as string[];
    const done = () => { setShared(true); setTimeout(() => setShared(false), 2000); };
    navigator.clipboard?.writeText(lines.join("\n")).then(done).catch(done) ?? done();
  }, [score, owned, missed]);

  const sneakiest = [...missed].sort((a, b) => b.sneaky - a.sneaky)[0] ?? null;

  return (
    <div className="shell stage-flicker">
      <CRT />
      {flash > 0 && <div key={flash} className="owned-flash go" />}

      {phase === "title" && <TitleScreen onStart={start} />}

      {phase === "play" && item && (
        <GameRound
          item={item}
          index={index}
          total={deck.length}
          score={score}
          results={results}
          onResolve={resolve}
        />
      )}

      {phase === "reveal" && last && item && (
        <RevealCard
          item={item}
          decision={last.decision}
          correct={last.correct}
          onNext={next}
          index={index}
          total={deck.length}
          results={results}
        />
      )}

      {phase === "score" && (
        <ScoreCard
          score={score}
          total={ROUNDS.length}
          owned={owned}
          sneakiest={sneakiest}
          verdict={computeVerdict(score, ROUNDS.length, owned)}
          onReplay={start}
          onShare={share}
          shared={shared}
        />
      )}
    </div>
  );
}
