const COLORS = {
  light: '#ffffff',
  dark: '#ececec',
  ice: '#bfe6fb',
  iceShine: '#ffffff',
  wall: '#7d8794',
  wallEdge: '#5c6570',
  box: '#c8873f',
  boxEdge: '#8a5521',
  roof: '#b5462f',
  house: '#e9c98b',
  door: '#6b4423',
  bloby: '#3cb043',
  blobyDark: '#2a8a31',
};

export function drawBoard(ctx, state, view, size) {
  const { width, height } = state;
  ctx.clearRect(0, 0, width * size, height * size);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.light : COLORS.dark;
      ctx.fillRect(x * size, y * size, size, size);
    }
  }

  for (const k of state.ice) {
    const [x, y] = k.split(',').map(Number);
    drawIce(ctx, x * size, y * size, size);
  }
  for (const k of state.walls) {
    const [x, y] = k.split(',').map(Number);
    drawWall(ctx, x * size, y * size, size);
  }
  for (const p of state.pads) drawPad(ctx, p.x * size, p.y * size, size, p.pair, view.time);
  drawHut(ctx, state.hut.x * size, state.hut.y * size, size);
  for (const b of view.boxes) drawBox(ctx, b.x * size, b.y * size, size);
  const atHome = view.bloby.x === state.hut.x && view.bloby.y === state.hut.y;
  if (atHome) {
    const small = size * 0.4;
    drawBloby(ctx, state.hut.x * size + (size - small) / 2, state.hut.y * size + size * 0.52, small, 0);
  } else {
    const s = size * view.scale;
    const offset = (size - s) / 2;
    drawBloby(ctx, view.bloby.x * size + offset, view.bloby.y * size + offset, s, view.squash);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawWall(ctx, x, y, s) {
  ctx.fillStyle = COLORS.wallEdge;
  ctx.fillRect(x, y, s, s);
  ctx.fillStyle = COLORS.wall;
  const gap = s * 0.06;
  const half = (s - gap * 3) / 2;
  ctx.fillRect(x + gap, y + gap, s - gap * 2, half);
  ctx.fillRect(x + gap, y + gap * 2 + half, half, half);
  ctx.fillRect(x + gap * 2 + half, y + gap * 2 + half, half, half);
}

function drawIce(ctx, x, y, s) {
  ctx.fillStyle = COLORS.ice;
  ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = COLORS.iceShine;
  ctx.lineWidth = s * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.2, y + s * 0.45);
  ctx.lineTo(x + s * 0.45, y + s * 0.2);
  ctx.moveTo(x + s * 0.5, y + s * 0.8);
  ctx.lineTo(x + s * 0.8, y + s * 0.5);
  ctx.stroke();
}

function drawBox(ctx, x, y, s) {
  const p = s * 0.08;
  roundRect(ctx, x + p, y + p, s - p * 2, s - p * 2, s * 0.08);
  ctx.fillStyle = COLORS.box;
  ctx.fill();
  ctx.lineWidth = s * 0.07;
  ctx.strokeStyle = COLORS.boxEdge;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + p * 2, y + p * 2);
  ctx.lineTo(x + s - p * 2, y + s - p * 2);
  ctx.moveTo(x + s - p * 2, y + p * 2);
  ctx.lineTo(x + p * 2, y + s - p * 2);
  ctx.lineWidth = s * 0.05;
  ctx.stroke();
}

const PAD_COLORS = ['#8e44ec', '#1e90ff', '#ff8c1a', '#e8368f'];

function drawPad(ctx, x, y, s, pair, time) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const color = PAD_COLORS[(pair - 1) % PAD_COLORS.length];
  const pulse = (Math.sin(time / 300) + 1) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = 0.35 + 0.65 * ((i / 3 + pulse) % 1);
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.arc(cx, cy, s * (0.12 + i * 0.12), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHut(ctx, x, y, s) {
  const bodyTop = y + s * 0.45;
  ctx.fillStyle = COLORS.house;
  ctx.fillRect(x + s * 0.18, bodyTop, s * 0.64, s * 0.45);
  ctx.beginPath();
  ctx.moveTo(x + s * 0.08, bodyTop + s * 0.02);
  ctx.lineTo(x + s * 0.5, y + s * 0.1);
  ctx.lineTo(x + s * 0.92, bodyTop + s * 0.02);
  ctx.closePath();
  ctx.fillStyle = COLORS.roof;
  ctx.fill();
  roundRect(ctx, x + s * 0.4, y + s * 0.6, s * 0.2, s * 0.3, [s * 0.1, s * 0.1, 0, 0]);
  ctx.fillStyle = COLORS.door;
  ctx.fill();
}

function drawBloby(ctx, x, y, s, squash) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const r = s * 0.38;
  const sx = 1 + squash * 0.15;
  const sy = 1 - squash * 0.15;

  ctx.save();
  ctx.translate(cx, cy + r * (1 - sy));
  ctx.scale(sx, sy);

  const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#7be07f');
  grad.addColorStop(1, COLORS.bloby);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = s * 0.03;
  ctx.strokeStyle = COLORS.blobyDark;
  ctx.stroke();

  for (const dx of [-0.32, 0.32]) {
    ctx.beginPath();
    ctx.arc(dx * r, -r * 0.15, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dx * r, -r * 0.1, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#1d2b1e';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, r * 0.25, r * 0.25, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.lineWidth = s * 0.035;
  ctx.strokeStyle = '#1d2b1e';
  ctx.stroke();
  ctx.restore();
}
