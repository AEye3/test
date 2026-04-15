const ROOMS = {
  Lobby: ["Hallway"],
  Hallway: ["Lobby", "Storage", "Control Room"],
  Storage: ["Hallway", "Boiler"],
  Boiler: ["Storage"],
  "Control Room": ["Hallway", "Exit"],
  Exit: [],
};

const game = {
  minute: 0,
  energy: 5,
  room: "Lobby",
  over: false,
};

const $minute = document.getElementById("minute");
const $energy = document.getElementById("energy");
const $room = document.getElementById("room");
const $story = document.getElementById("story");
const $actions = document.getElementById("actions");
const $waitBtn = document.getElementById("waitBtn");
const $restartBtn = document.getElementById("restartBtn");
const $log = document.getElementById("log");

function addLog(text) {
  const li = document.createElement("li");
  li.textContent = text;
  $log.prepend(li);
}

function randomEvent() {
  const roll = Math.random();
  if (roll < 0.25) {
    game.energy -= 1;
    addLog("A shadow startles you. -1 energy.");
  } else if (roll > 0.85) {
    game.energy += 1;
    addLog("You found a snack bar. +1 energy.");
  } else {
    addLog("No event this minute.");
  }
}

function endGame(message) {
  game.over = true;
  $story.textContent = message;
  addLog(message);
  render();
}

function tick() {
  game.minute += 1;
  randomEvent();

  if (game.room === "Exit") {
    endGame("You escaped in time. You win!");
    return;
  }

  if (game.energy <= 0) {
    endGame("You collapse from exhaustion. Game over.");
    return;
  }

  if (game.minute >= 10) {
    endGame("Time ran out. The building locks down. Game over.");
    return;
  }

  render();
}

function moveTo(room) {
  if (game.over) return;
  game.room = room;
  addLog(`You moved to ${room}.`);
  tick();
}

function waitTurn() {
  if (game.over) return;
  addLog("You wait and listen to distant machinery.");
  tick();
}

function renderActions() {
  $actions.innerHTML = "";
  ROOMS[game.room].forEach((nextRoom) => {
    const btn = document.createElement("button");
    btn.textContent = `Go to ${nextRoom}`;
    btn.disabled = game.over;
    btn.addEventListener("click", () => moveTo(nextRoom));
    $actions.appendChild(btn);
  });

  $waitBtn.disabled = game.over;
}

function render() {
  $minute.textContent = String(game.minute);
  $energy.textContent = String(game.energy);
  $room.textContent = game.room;

  if (!game.over) {
    $story.textContent = "Reach the Exit by minute 10 before your energy hits 0.";
  }

  renderActions();
}

function restart() {
  game.minute = 0;
  game.energy = 5;
  game.room = "Lobby";
  game.over = false;
  $log.innerHTML = "";
  addLog("Game started.");
  render();
}

$waitBtn.addEventListener("click", waitTurn);
$restartBtn.addEventListener("click", restart);

restart();
