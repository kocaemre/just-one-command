/* ============ Continue? — screens ============ */
const { useState: useS, useEffect: useE, useRef: useR } = React;

/* ---------------- 1. Title ---------------- */
function TitleScreen({ onStart }) {
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
        <span className="hide-sm">10 COMMANDS · 8s EACH</span>
      </div>
    </div>
  );
}

/* ---------------- 2. Gameplay round ---------------- */
function GameRound({ item, index, total, score, results, duration, onResolve }) {
  return (
    <div className="frame">
      <div className="hud">
        <div className="pips">
          {Array.from({ length: total }).map((_, i) => {
            let cls = "pip";
            if (i < results.length) cls += results[i] ? " good" : " bad";
            else if (i === index) cls += " now";
            return <span key={i} className={cls} />;
          })}
        </div>
        <div className="score">ROUND <b>{index + 1}</b>/{total} · SCORE <b>{score}</b></div>
      </div>

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
          {item.overflow && (
            <div className="overflow-hint">→ scroll · line continues past edge</div>
          )}

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
            duration={duration}
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

/* ---------------- 3. Reveal ---------------- */
function RevealCard({ item, decision, correct, owned, onNext, index, total, results }) {
  const approved = decision === "approve";
  const timedOut = decision === "timeout";
  const didText = approved || timedOut ? item.didSafe : item.didDanger;

  let verdictText;
  if (timedOut) verdictText = "TIMED OUT — AUTO-RAN";
  else if (correct) verdictText = approved ? "SAFE — ALLOWED" : "TRAP — DENIED";
  else verdictText = approved ? "OWNED" : "FALSE ALARM";

  return (
    <div className="frame">
      <div className="hud">
        <div className="pips">
          {Array.from({ length: total }).map((_, i) => {
            let cls = "pip";
            if (i < (results ? results.length : 0)) cls += results[i] ? " good" : " bad";
            else if (i === index) cls += " now";
            return <span key={i} className={cls} />;
          })}
        </div>
        <div className="score">ROUND <b>{index + 1}</b>/{total}</div>
      </div>

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

          <button className="btn btn-block" onClick={onNext}
                  style={correct
                    ? { borderColor: "var(--green-dim)", color: "var(--green)" }
                    : { borderColor: "var(--red-dim)", color: "var(--red)" }}>
            {index + 1 < total ? "NEXT COMMAND ›" : "SEE RESULTS ›"} <span className="mono-label" style={{ marginLeft: 8 }}>[ENTER]</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 4. Score card ---------------- */
function ScoreCard({ score, total, owned, sneakiest, verdict, onReplay, onShare, shared }) {
  return (
    <div className="frame fade-up">
      <div className="scorecard" id="scorecard">
        <div className="sc-top">
          <span className="sc-brand"><b>CONTINUE?</b> · approval reflex test</span>
          <span className="sc-brand">{new Date().toISOString().slice(0,10)}</span>
        </div>

        <div className="sc-score">{score}<span className="denom">/{total}</span></div>
        <div className="sc-verdict" dangerouslySetInnerHTML={{ __html: verdict }} />

        <div className="sc-stats">
          <div className="sc-stat">
            <div className={"n " + (owned > 0 ? "red" : "green")}>{owned}×</div>
            <div className="l">Got owned</div>
          </div>
          <div className="sc-stat">
            <div className={"n " + (score >= total - 2 ? "green" : "red")}>{Math.round((score/total)*100)}%</div>
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

Object.assign(window, { TitleScreen, GameRound, RevealCard, ScoreCard });
