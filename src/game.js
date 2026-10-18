const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const key = (p) => `${p.x},${p.y}`;

export function parseLevel(rows) {
  const walls = new Set();
  const ice = new Set();
  const boxes = [];
  const pads = {};
  let bloby = null;
  let hut = null;
  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === '#') walls.add(key({ x, y }));
      if (cell === '~') ice.add(key({ x, y }));
      if (cell === 'B') boxes.push({ x, y });
      if (cell === '@') bloby = { x, y };
      if (cell === 'H') hut = { x, y };
      if (cell >= '1' && cell <= '9') (pads[cell] ??= []).push({ x, y });
    });
  });
  // Teleportfelder mit derselben Ziffer bilden ein Paar und führen zueinander.
  const teleports = new Map();
  for (const [a, b] of Object.values(pads)) {
    teleports.set(key(a), b);
    teleports.set(key(b), a);
  }
  return {
    width: Math.max(...rows.map((r) => r.length)),
    height: rows.length,
    walls,
    ice,
    boxes,
    teleports,
    pads: Object.entries(pads).flatMap(([pair, ps]) => ps.map((p) => ({ ...p, pair: Number(pair) }))),
    bloby,
    hut,
    moves: 0,
  };
}

function isFree(state, p) {
  return (
    p.x >= 0 && p.y >= 0 && p.x < state.width && p.y < state.height &&
    !state.walls.has(key(p)) &&
    !state.boxes.some((b) => b.x === p.x && b.y === p.y)
  );
}

// Auf Eis rutscht Bloby weiter, bis ihn etwas aufhält.
function slide(state, p, d) {
  while (state.ice.has(key(p))) {
    const next = { x: p.x + d.x, y: p.y + d.y };
    if (!isFree(state, next)) break;
    p = next;
  }
  return p;
}

export function move(state, direction) {
  const d = DIRECTIONS[direction];
  const target = { x: state.bloby.x + d.x, y: state.bloby.y + d.y };
  const boxIndex = state.boxes.findIndex((b) => b.x === target.x && b.y === target.y);

  if (boxIndex === -1) {
    if (!isFree(state, target)) return state;
    const bloby = state.teleports.get(key(target)) ?? slide(state, target, d);
    return { ...state, bloby, moves: state.moves + 1 };
  }

  const behind = { x: target.x + d.x, y: target.y + d.y };
  const blocksHut = behind.x === state.hut.x && behind.y === state.hut.y;
  if (!isFree(state, behind) || blocksHut || state.teleports.has(key(behind))) return state;
  const boxes = state.boxes.map((b, i) => (i === boxIndex ? behind : b));
  return { ...state, bloby: target, boxes, moves: state.moves + 1 };
}

export function isWon(state) {
  return state.bloby.x === state.hut.x && state.bloby.y === state.hut.y;
}
