import { parseLevel, move, isWon } from './game.js';
import { levels, bonusLevels } from './levels.js';
import { fewestMoves } from './solver.js';
import { drawBoard } from './render.js';

const STORAGE_KEY = 'bloby.unlocked';
const STARS_KEY = 'bloby.stars';
const STARS_FOR_BONUS = 5;
const ANIMATION_MS = 120;

const allLevels = [...levels, ...bonusLevels];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const levelLabel = document.getElementById('level-label');
const movesLabel = document.getElementById('moves-label');
const starsButton = document.getElementById('stars');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayButton = document.getElementById('overlay-button');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');

let levelIndex = 0;
let unlocked = load(STORAGE_KEY, 0);
const stars = new Set(load(STARS_KEY, []));
const pars = new Map();
let state;
let history = [];
let animation = null;
let overlayAction = null;
let cellSize = 40;

function load(storageKey, fallback) {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(storageKey, value) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Spielstand bleibt dann nur für diese Sitzung erhalten.
  }
}

function isInstalledApp() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function mainStars() {
  return [...stars].filter((i) => i < levels.length).length;
}

function bonusOpen() {
  return mainStars() >= STARS_FOR_BONUS && isInstalledApp();
}

function lastPlayable() {
  return bonusOpen() ? allLevels.length - 1 : levels.length - 1;
}

function par(index) {
  if (!pars.has(index)) pars.set(index, fewestMoves(parseLevel(allLevels[index])));
  return pars.get(index);
}

function startLevel(index) {
  levelIndex = index;
  state = parseLevel(allLevels[index]);
  history = [];
  animation = null;
  overlay.hidden = true;
  resize();
  updateHud();
}

function updateHud() {
  const isBonus = levelIndex >= levels.length;
  const star = stars.has(levelIndex) ? ' ⭐' : '';
  levelLabel.textContent = isBonus
    ? `❄️ Bonus ${levelIndex - levels.length + 1} / ${bonusLevels.length}${star}`
    : `Level ${levelIndex + 1} / ${levels.length}${star}`;
  movesLabel.textContent = `Züge: ${state.moves} · Ziel: ${par(levelIndex)}`;
  starsButton.textContent = mainStars() < STARS_FOR_BONUS
    ? `⭐ ${mainStars()} / ${STARS_FOR_BONUS}`
    : `⭐ ${mainStars()}`;
  prevButton.disabled = levelIndex === 0;
  nextButton.disabled = levelIndex >= Math.min(unlocked, lastPlayable());
}

function resize() {
  const main = canvas.parentElement;
  const availW = main.clientWidth - 32;
  const availH = main.clientHeight;
  cellSize = Math.floor(Math.min(availW / state.width, availH / state.height));
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${cellSize * state.width}px`;
  canvas.style.height = `${cellSize * state.height}px`;
  canvas.width = cellSize * state.width * dpr;
  canvas.height = cellSize * state.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function tryMove(direction) {
  if (!overlay.hidden) return;
  const next = move(state, direction);
  if (next === state) return;
  history.push(state);
  const d = STEPS[direction];
  const entry = { x: state.bloby.x + d.x, y: state.bloby.y + d.y };
  const teleported = state.teleports.has(`${entry.x},${entry.y}`);
  const distance = Math.abs(next.bloby.x - state.bloby.x) + Math.abs(next.bloby.y - state.bloby.y);
  const duration = teleported ? ANIMATION_MS * 3 : ANIMATION_MS * Math.max(1, distance * 0.6);
  animation = { from: state, entry, teleported, duration, start: performance.now() };
  state = next;
  updateHud();
  if (isWon(state)) setTimeout(showWin, duration + 80);
}

// Auch das Zurücknehmen kostet einen Zug.
function undo() {
  if (!overlay.hidden || history.length === 0) return;
  state = { ...history.pop(), moves: state.moves + 1 };
  animation = null;
  updateHud();
}

function showOverlay(title, text, buttonLabel, action) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = buttonLabel;
  overlayAction = action;
  overlay.hidden = false;
}

function bonusHint() {
  const missing = STARS_FOR_BONUS - mainStars();
  if (missing > 0) {
    return `Sammle noch ${missing} ${missing === 1 ? 'Stern' : 'Sterne'}, dann öffnet sich die Bonuswelt. Einen Stern gibt es, wenn du ein Level mit der Ziel-Zugzahl schaffst.`;
  }
  if (!isInstalledApp()) {
    return 'Du hast genug Sterne! Die Bonuswelt gibt es in der App: Installiere Bloby über das Browser-Menü („Zum Startbildschirm hinzufügen“).';
  }
  return 'Die Bonuswelt ist offen! Auf Eis rutscht Bloby, bis ihn etwas aufhält.';
}

function showWin() {
  const hadBonus = bonusOpen();
  const perfect = state.moves <= par(levelIndex);
  if (perfect) {
    stars.add(levelIndex);
    save(STARS_KEY, [...stars]);
  }
  if (unlocked <= levelIndex) {
    unlocked = Math.min(levelIndex + 1, allLevels.length - 1);
    save(STORAGE_KEY, unlocked);
  }
  updateHud();

  const starText = perfect
    ? '⭐ Perfekt! Du hast die kleinste Zugzahl geschafft und bekommst einen Stern.'
    : `Du hast ${state.moves} Züge gebraucht. Mit ${par(levelIndex)} Zügen gibt es einen Stern.`;
  const bonusText = !hadBonus && bonusOpen() ? ' Die Bonuswelt ist jetzt offen!' : '';
  const isLastMain = levelIndex === levels.length - 1;
  const isLastBonus = levelIndex === allLevels.length - 1;

  if (isLastBonus) {
    showOverlay('Super! Du hast auch die Bonuswelt geschafft!', 'Möchtest du noch einmal spielen?', 'Ja, noch einmal!', () => startLevel(0));
  } else if (isLastMain && bonusOpen()) {
    showOverlay('Super! Du hast alle Level geschafft!', `${starText} Weiter geht es in der Bonuswelt.`, 'Zur Bonuswelt', () => startLevel(levels.length));
  } else if (isLastMain) {
    showOverlay('Super! Du hast alle Level geschafft!', `${starText} Möchtest du noch einmal spielen?`, 'Ja, noch einmal!', () => startLevel(0));
  } else {
    showOverlay('Bloby ist zu Hause!', starText + bonusText, 'Nächstes Level', () => startLevel(levelIndex + 1));
  }
}

overlayButton.addEventListener('click', () => overlayAction());
starsButton.addEventListener('click', () => {
  if (!overlay.hidden) return;
  if (bonusOpen()) {
    showOverlay('❄️ Bonuswelt', bonusHint(), 'Los geht’s', () => startLevel(Math.max(levels.length, Math.min(unlocked, lastPlayable()))));
  } else {
    showOverlay('⭐ Sterne', bonusHint(), 'OK', () => { overlay.hidden = true; });
  }
});
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('restart').addEventListener('click', () => startLevel(levelIndex));
prevButton.addEventListener('click', () => levelIndex > 0 && startLevel(levelIndex - 1));
nextButton.addEventListener('click', () => !nextButton.disabled && startLevel(levelIndex + 1));

const STEPS = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
};

window.addEventListener('keydown', (e) => {
  if (KEYS[e.key]) {
    e.preventDefault();
    tryMove(KEYS[e.key]);
  } else if (e.key === 'z' || e.key === 'Backspace') {
    undo();
  } else if (e.key === 'r') {
    startLevel(levelIndex);
  } else if (e.key === 'Enter' && !overlay.hidden) {
    overlayButton.click();
  }
});

let touchStart = null;
window.addEventListener('touchstart', (e) => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
window.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) tryMove(dx > 0 ? 'right' : 'left');
  else tryMove(dy > 0 ? 'down' : 'up');
});

// Beobachtet den Spielbereich statt des Fensters: Installierte iOS-Apps bekommen ihre
// endgültige Höhe oft erst nach dem Start, ohne dass ein resize-Ereignis kommt.
new ResizeObserver(() => state && resize()).observe(canvas.parentElement);

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function frame(now) {
  let view = { bloby: state.bloby, boxes: state.boxes, squash: 0, scale: 1, time: now };
  if (animation) {
    const t = Math.min((now - animation.start) / animation.duration, 1);
    if (animation.teleported) {
      // Erst aufs Teleportfeld rollen und schrumpfen, dann am Partnerfeld wieder wachsen.
      const onEntry = t < 0.5;
      const half = onEntry ? t * 2 : t * 2 - 1;
      view = {
        ...view,
        bloby: onEntry ? lerp(animation.from.bloby, animation.entry, Math.min(half * 2, 1)) : state.bloby,
        scale: onEntry ? 1 - Math.max(half * 2 - 1, 0) : half,
      };
    } else {
      const ease = 1 - (1 - t) ** 2;
      view = {
        ...view,
        bloby: lerp(animation.from.bloby, state.bloby, ease),
        boxes: state.boxes.map((b, i) => lerp(animation.from.boxes[i], b, ease)),
        squash: Math.sin(t * Math.PI),
      };
    }
    if (t === 1) animation = null;
  }
  drawBoard(ctx, state, view, cellSize);
  requestAnimationFrame(frame);
}

startLevel(Math.min(unlocked, lastPlayable()));
requestAnimationFrame(frame);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('sw.js');
}

// iOS holt eine installierte App aus dem Speicher, ohne sie neu zu laden.
// Daher beim Zurückkehren prüfen, ob online eine neuere Version liegt.
async function reloadIfOutdated() {
  try {
    const html = await (await fetch(location.href, { cache: 'no-cache' })).text();
    const script = document.querySelector('script[type="module"]').getAttribute('src');
    if (!html.includes(script)) location.reload();
  } catch {
    // Offline: mit der vorhandenen Version weiterspielen.
  }
}

if (import.meta.env.PROD) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reloadIfOutdated();
  });
}
