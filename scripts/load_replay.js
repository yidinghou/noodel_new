#!/usr/bin/env node
/**
 * Loads claude_play_session.json into the running server as a leaderboard entry,
 * then prints the URL to open in game_replay.html.
 *
 * Usage:
 *   node scripts/load_replay.js
 *
 * Requires the server to be running (npm start or npm run dev + npm start).
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const session = JSON.parse(readFileSync(join(__dirname, 'claude_play_session.json'), 'utf8'));

const score = session.checkpoint?.score ?? 0;

const res = await fetch('http://localhost:3000/api/scores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    score,
    gameMode: session.gameMode,
    username: 'claude',
    sessionData: session,
  }),
});

if (!res.ok) {
  console.error('❌ Failed to upload session:', res.status, await res.text());
  process.exit(1);
}

const row = await res.json();
console.log(`✅ Session uploaded (score: ${score}, id: ${row.id})`);
console.log(`\n👀 Open in browser:`);
console.log(`   http://localhost:3000/game_replay.html`);
console.log(`\n   Then open Settings → Leaderboard and click ▶ on the "claude" row.`);
console.log(`\n   Or paste this into the browser console on that page:`);
console.log(`\n   fetch('/api/scores/${row.id}/session').then(r=>r.json()).then(s=>{localStorage.setItem('noodel_replay_session',JSON.stringify(s));location.reload();})`);
