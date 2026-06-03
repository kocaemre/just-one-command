# just-one-command

> *"It's just one command. What could go wrong?"*

A reflex game that teaches developers the danger of blindly approving AI agent suggestions. You're shown shell commands one at a time — approve the safe ones, deny the traps — before the timer runs out.

**Play it: [just-one-command.vercel.app](https://just-one-command.vercel.app/)**

---

## What is this?

AI coding agents like Claude Code, Cursor, and Copilot Workspace suggest shell commands that need your approval. In practice, most developers glance at the command and click yes — especially when they're context-switching, in a meeting, or just tired.

This game simulates that exact moment. Each round looks like a real agent approval prompt. Some commands are safe. Some will wipe your home directory, exfiltrate your `.env`, or install a persistent backdoor — dressed up as routine maintenance.

The punchline: **you'd actually click approve on some of these.**

---

## How to play

- Read the command and the agent's explanation
- Press **1** to approve or **2** to deny (keyboard-first)
- On mobile: large tap targets for both choices
- You have **5.5 seconds** per command
- 10 rounds, shuffled every session

After each round you see what the command actually did. After all 10, you get a shareable score card.

---

## Commands in the game

The game includes a mix of genuinely safe commands and traps at different difficulty levels:

| Tier | Examples |
|------|---------|
| LOW | `git log`, `npm audit fix`, `npx prettier --write src/` |
| MEDIUM | `git push --force origin main` |
| CRITICAL | env exfiltration via curl pipe, npm registry poisoning, cron backdoor, hidden payload past the scroll edge |

The hardest ones look completely routine. That's the point.

---

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- No UI library — pure CSS with custom properties
- CRT scanline + grain aesthetic, rAF-driven timer

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## The lesson

Read the full command. Not just the comment. Not just the first token. The whole line — including what's past the scroll edge.

The agent's narration is designed to sound trustworthy. The comment can lie. The dangerous part is usually at the end.
