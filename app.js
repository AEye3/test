const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");

const $time = document.getElementById("time");
const $currency = document.getElementById("currency");
const $hp = document.getElementById("hp");
const $level = document.getElementById("level");
const $status = document.getElementById("status");
const $startBtn = document.getElementById("startBtn");
const $restartBtn = document.getElementById("restartBtn");
const $shop = document.getElementById("shop");

const RUN_LENGTH_SECONDS = 300;

const state = {
  running: false,
  time: 0,
  currency: 0,
  hp: 3,
  level: 1,
  spawnRate: 1.2,
  bulletSpeed: 140,
  passiveIncome: 4,
  player: { x: canvas.width / 2, y: canvas.height / 2, r: 9, speed: 220 },
  bullets: [],
  keys: {},
  invulnerableFor: 0,
};

const upgrades = [
  {
    id: "speed",
    name: "Leg Motors",
    desc: "+25 move speed",
    baseCost: 20,
    level: 0,
    apply: () => {
      state.player.speed += 25;
    },
  },
  {
    id: "income",
    name: "Data Miner",
    desc: "+2 currency/sec",
    baseCost: 30,
    level: 0,
    apply: () => {
      state.passiveIncome += 2;
    },
  },
  {
    id: "vital",
    name: "Nano Patch",
    desc: "+1 HP (max 8)",
    baseCost: 45,
    level: 0,
    apply: () => {
      state.hp = Math.min(8, state.hp + 1);
    },
  },
  {
    id: "control",
    name: "Threat Analysis",
    desc: "bullets slightly slower",
    baseCost: 55,
    level: 0,
    apply: () => {
      state.bulletSpeed = Math.max(85, state.bulletSpeed - 10);
    },
  },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function getCost(upgrade) {
  return Math.floor(upgrade.baseCost * Math.pow(1.6, upgrade.level));
}

function renderShop() {
  $shop.innerHTML = "";
  for (const up of upgrades) {
    const cost = getCost(up);
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h4");
    title.textContent = `${up.name} (Lv.${up.level})`;

    const desc = document.createElement("p");
    desc.textContent = `${up.desc} · Cost: ${cost}`;

    const btn = document.createElement("button");
    btn.textContent = "Buy Upgrade";
    btn.disabled = !state.running || state.currency < cost;
    btn.addEventListener("click", () => buyUpgrade(up));

    card.append(title, desc, btn);
    $shop.appendChild(card);
  }
}

function buyUpgrade(upgrade) {
  const cost = getCost(upgrade);
  if (!state.running || state.currency < cost) return;

  state.currency -= cost;
  upgrade.level += 1;
  upgrade.apply();
  state.level = upgrades.reduce((acc, u) => acc + u.level, 1);
  setStatus(`Purchased ${upgrade.name}.`);
  renderUI();
}

function setStatus(msg) {
  $status.textContent = msg;
}

function resetState() {
  state.running = false;
  state.time = 0;
  state.currency = 0;
  state.hp = 3;
  state.level = 1;
  state.spawnRate = 1.2;
  state.bulletSpeed = 140;
  state.passiveIncome = 4;
  state.player.x = canvas.width / 2;
  state.player.y = canvas.height / 2;
  state.bullets = [];
  state.keys = {};
  state.invulnerableFor = 0;
  spawnAccumulator = 0;
  incomeAccumulator = 0;
  lastTs = 0;

  for (const u of upgrades) u.level = 0;

  setStatus("Move with WASD / Arrow keys. Press Start Run.");
  renderUI();
  draw();
}

function renderUI() {
  $time.textContent = formatTime(state.time);
  $currency.textContent = Math.floor(state.currency);
  $hp.textContent = state.hp;
  $level.textContent = state.level;
  $startBtn.disabled = state.running;
  renderShop();
}

function spawnBullet() {
  const edge = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (edge === 0) {
    x = Math.random() * canvas.width;
    y = -10;
  } else if (edge === 1) {
    x = canvas.width + 10;
    y = Math.random() * canvas.height;
  } else if (edge === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + 10;
  } else {
    x = -10;
    y = Math.random() * canvas.height;
  }

  const dx = state.player.x - x;
  const dy = state.player.y - y;
  const dist = Math.hypot(dx, dy) || 1;

  state.bullets.push({
    x,
    y,
    vx: (dx / dist) * state.bulletSpeed,
    vy: (dy / dist) * state.bulletSpeed,
    r: 6,
  });
}

let lastTs = 0;
let spawnAccumulator = 0;
let incomeAccumulator = 0;

function update(dt) {
  if (!state.running) return;

  state.time += dt;
  state.invulnerableFor = Math.max(0, state.invulnerableFor - dt);
  incomeAccumulator += dt;
  spawnAccumulator += dt;

  while (incomeAccumulator >= 1) {
    state.currency += state.passiveIncome;
    incomeAccumulator -= 1;
  }

  const dynamicRate = Math.max(0.25, state.spawnRate - state.time * 0.0025);
  while (spawnAccumulator >= dynamicRate) {
    spawnBullet();
    spawnAccumulator -= dynamicRate;
  }

  const p = state.player;
  const xMove = (state.keys.ArrowRight || state.keys.d ? 1 : 0) - (state.keys.ArrowLeft || state.keys.a ? 1 : 0);
  const yMove = (state.keys.ArrowDown || state.keys.s ? 1 : 0) - (state.keys.ArrowUp || state.keys.w ? 1 : 0);

  if (xMove || yMove) {
    const len = Math.hypot(xMove, yMove) || 1;
    p.x += (xMove / len) * p.speed * dt;
    p.y += (yMove / len) * p.speed * dt;
    p.x = Math.min(canvas.width - p.r, Math.max(p.r, p.x));
    p.y = Math.min(canvas.height - p.r, Math.max(p.r, p.y));
  }

  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }

  state.bullets = state.bullets.filter(
    (b) => b.x > -20 && b.x < canvas.width + 20 && b.y > -20 && b.y < canvas.height + 20
  );

  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const b = state.bullets[i];
    if (Math.hypot(b.x - p.x, b.y - p.y) < b.r + p.r && state.invulnerableFor <= 0) {
      state.bullets.splice(i, 1);
      state.hp -= 1;
      state.invulnerableFor = 0.8;
      setStatus("Hit! Keep moving.");
      if (state.hp <= 0) {
        state.running = false;
        setStatus("Run failed. You were overwhelmed.");
      }
    }
  }

  if (state.time >= RUN_LENGTH_SECONDS && state.running) {
    state.running = false;
    setStatus("You survived 5 minutes. Victory!");
  }

  renderUI();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(90, 115, 190, 0.2)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  ctx.fillStyle = "#fe4b58";
  for (const b of state.bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#73f0c4";
  if (state.invulnerableFor > 0) {
    ctx.fillStyle = "#f7f08a";
  }
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
  ctx.fill();
}

function frame(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.033, (ts - lastTs) / 1000);
  lastTs = ts;

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (e) => {
  state.keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
  state.keys[e.key] = false;
});

for (const btn of document.querySelectorAll("[data-dir]")) {
  const dir = btn.getAttribute("data-dir");
  const keyMap = { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" };
  const key = keyMap[dir];
  if (!key) continue;
  btn.addEventListener("pointerdown", () => {
    state.keys[key] = true;
  });
  btn.addEventListener("pointerup", () => {
    state.keys[key] = false;
  });
  btn.addEventListener("pointercancel", () => {
    state.keys[key] = false;
  });
  btn.addEventListener("lostpointercapture", () => {
    state.keys[key] = false;
  });
}

$startBtn.addEventListener("click", () => {
  if (state.running) return;
  state.running = true;
  state.bullets = [];
  spawnAccumulator = 0;
  incomeAccumulator = 0;
  setStatus("Run started. Survive for 5 minutes.");
  renderUI();
});

$restartBtn.addEventListener("click", () => {
  resetState();
});

resetState();
requestAnimationFrame(frame);
