import { move, isWon } from './game.js';

const id = (s) => `${s.bloby.x},${s.bloby.y}|${s.boxes.map((b) => `${b.x},${b.y}`).sort().join(';')}`;

// Breitensuche über alle Spielzustände; liefert die kleinste mögliche Zugzahl.
export function fewestMoves(state) {
  const seen = new Set([id(state)]);
  let frontier = [state];
  for (let depth = 0; frontier.length > 0; depth++) {
    const next = [];
    for (const s of frontier) {
      if (isWon(s)) return depth;
      for (const dir of ['up', 'down', 'left', 'right']) {
        const n = move(s, dir);
        if (n !== s && !seen.has(id(n))) {
          seen.add(id(n));
          next.push(n);
        }
      }
    }
    frontier = next;
  }
  return null;
}
