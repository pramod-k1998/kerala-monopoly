/* Kayalorangal — Kerala-themed Monopoly-style game
   Realtime sync via Firebase Realtime Database. */

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const PROFILE_COLORS = ["#0F6E6E", "#C1543A", "#315D9B", "#D9A441", "#3F7D4A", "#8A4F72"];
const LEGACY_PROFILE_COLORS = ["#0F6E6E", "#C1543A", "#315D9B", "#D9A441"];

// ---------- local identity ----------
let myId = localStorage.getItem("kay_playerId") || sessionStorage.getItem("kay_playerId");
if (!myId) {
  myId = "p_" + Math.random().toString(36).slice(2, 10);
}
localStorage.setItem("kay_playerId", myId);
let myName = localStorage.getItem("kay_name") || "";
let roomCode = sessionStorage.getItem("kay_room") || null;
let roomRef = null;
let currentRoom = null; // last snapshot of room data
let selectedToken = null;

// ---------- element refs ----------
const $ = (id) => document.getElementById(id);
const screens = {
  lobby: $("screen-lobby"),
  waiting: $("screen-waiting"),
  game: $("screen-game"),
  over: $("screen-gameover"),
};
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

// ============================================================
// LOBBY: create / join
// ============================================================
$("player-name").value = myName;

function makeRoomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 5; i++) c += letters[Math.floor(Math.random() * letters.length)];
  return c;
}

$("btn-create-room").addEventListener("click", async () => {
  const name = $("player-name").value.trim();
  if (!name) return showLobbyError("Enter your name first.");
  myName = name;
  localStorage.setItem("kay_name", name);

  const code = makeRoomCode();
  const ref = db.ref("rooms/" + code);
  await ref.set({
    status: "lobby",
    hostId: myId,
    createdAt: Date.now(),
    players: {
      [myId]: { name, token: "", profileColor: PROFILE_COLORS[0], ready: false, money: START_MONEY, position: 0, inJail: false, jailTurns: 0, out: false, joinOrder: 0 },
    },
  });
  enterRoom(code);
});

$("btn-join-room").addEventListener("click", async () => {
  const name = $("player-name").value.trim();
  const code = $("join-code").value.trim().toUpperCase();
  if (!name) return showLobbyError("Enter your name first.");
  if (!code) return showLobbyError("Enter a room code.");
  myName = name;
  localStorage.setItem("kay_name", name);

  const snap = await db.ref("rooms/" + code).get();
  if (!snap.exists()) return showLobbyError("No room found with that code.");
  const room = snap.val();
  if (room.status !== "lobby") return showLobbyError("That game has already started.");
  const count = Object.keys(room.players || {}).length;
  if (count >= 4) return showLobbyError("That room is full (4 players max).");

  await db.ref(`rooms/${code}/players/${myId}`).set({
    name, token: "", profileColor: availableProfileColor(room.players || {}), ready: false, money: START_MONEY, position: 0, inJail: false, jailTurns: 0, out: false, joinOrder: count,
  });
  enterRoom(code);
});

function showLobbyError(msg) { $("lobby-error").textContent = msg; }

function enterRoom(code) {
  roomCode = code;
  sessionStorage.setItem("kay_room", code);
  attachRoomListener();
}

function availableProfileColor(players) {
  const used = new Set(Object.values(players).map((player, index) => player.profileColor || LEGACY_PROFILE_COLORS[index % LEGACY_PROFILE_COLORS.length]));
  return PROFILE_COLORS.find((color) => !used.has(color)) || PROFILE_COLORS[0];
}

function makeRemoveButton(playerId, playerName) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "remove-player";
  button.textContent = "Remove";
  button.setAttribute("aria-label", `Remove ${playerName}`);
  button.addEventListener("click", () => removeRoomPlayer(playerId, playerName));
  return button;
}

async function removeRoomPlayer(playerId, playerName) {
  if (!currentRoom || myId !== currentRoom.hostId || playerId === myId) return;
  if (!confirm(`Remove ${playerName} from this room?`)) return;

  const snap = await roomRef.get();
  if (!snap.exists()) return;
  const room = snap.val();
  if (room.hostId !== myId || !room.players?.[playerId]) return;
  const updates = { [`players/${playerId}`]: null };
  Object.entries(room.ownership || {}).forEach(([tileIndex, ownerId]) => {
    if (ownerId === playerId) updates[`ownership/${tileIndex}`] = null;
  });

  if (room.status === "playing") {
    const oldOrder = room.order || Object.keys(room.players);
    const oldTurnId = oldOrder[room.turn];
    const newOrder = oldOrder.filter((id) => id !== playerId);
    updates.order = newOrder;
    if (newOrder.length <= 1) {
      updates.status = "over";
      updates.winner = newOrder[0] || null;
      updates.turn = 0;
      updates.pendingDecision = null;
      updates.diceRolled = false;
    } else if (oldTurnId === playerId) {
      const nextOldId = oldOrder.slice(room.turn + 1).concat(oldOrder.slice(0, room.turn))
        .find((id) => id !== playerId);
      updates.turn = newOrder.indexOf(nextOldId);
      updates.diceRolled = false;
      updates.doublesCount = 0;
      if (room.pendingDecision?.playerId === playerId) updates.pendingDecision = null;
    } else {
      updates.turn = newOrder.indexOf(oldTurnId);
    }
  }

  await roomRef.update(updates);
  await pushLog(`${playerName} was removed by the host.`);
}

// auto-rejoin on refresh
const urlParams = new URLSearchParams(location.search);
if (urlParams.get("room")) {
  $("join-code").value = urlParams.get("room").toUpperCase();
}
if (roomCode) {
  db.ref("rooms/" + roomCode).get().then((snap) => {
    if (snap.exists() && snap.val().players && snap.val().players[myId]) {
      attachRoomListener();
    }
  });
}

// ============================================================
// ROOM LISTENER — drives waiting room + game screen
// ============================================================
function attachRoomListener() {
  roomRef = db.ref("rooms/" + roomCode);
  roomRef.on("value", (snap) => {
    if (!snap.exists()) return;
    currentRoom = snap.val();
    if (!currentRoom.players?.[myId]) {
      roomRef.off();
      roomRef.child("chat").off();
      sessionStorage.removeItem("kay_room");
      roomCode = null;
      showScreen("lobby");
      showLobbyError("The host removed you from the room.");
      return;
    }
    if (currentRoom.status === "lobby") renderWaitingRoom();
    else if (currentRoom.status === "playing") renderGameScreen();
    else if (currentRoom.status === "over") renderGameOver();
  });
  roomRef.child("chat").on("child_added", (snap) => appendChatMessage(snap.val()));
}

// ============================================================
// WAITING ROOM
// ============================================================
function renderWaitingRoom() {
  showScreen("waiting");
  $("room-code-display").textContent = roomCode;
  const players = currentRoom.players || {};
  const list = $("waiting-players");
  list.innerHTML = "";
  const taken = new Set(Object.entries(players).filter(([id]) => id !== myId).map(([id, p]) => playerColor(id, Object.keys(players))));

  Object.entries(players)
    .sort((a, b) => a[1].joinOrder - b[1].joinOrder)
    .forEach(([id, p]) => {
      const li = document.createElement("li");
      const avatar = document.createElement("span");
      avatar.className = "profile-avatar";
      avatar.textContent = p.name.trim().charAt(0).toUpperCase();
      avatar.style.backgroundColor = playerColor(id, Object.keys(players));
      const name = document.createElement("span");
      name.className = "waiting-player-name";
      name.textContent = `${p.name}${id === currentRoom.hostId ? " (host)" : ""}`;
      const ready = document.createElement("span");
      ready.className = `ready-dot ${p.ready ? "on" : ""}`;
      li.append(avatar, name, ready);
      if (myId === currentRoom.hostId && id !== myId) {
        const remove = makeRemoveButton(id, p.name);
        li.appendChild(remove);
      }
      list.appendChild(li);
    });

  const choices = $("token-choices");
  choices.innerHTML = "";
  PROFILE_COLORS.forEach((color, index) => {
    const btn = document.createElement("button");
    btn.className = "token-choice";
    btn.type = "button";
    btn.style.backgroundColor = color;
    btn.setAttribute("aria-label", `Choose profile color ${index + 1}`);
    btn.title = `Color ${index + 1}`;
    const isMine = players[myId] && playerColor(myId, Object.keys(players)) === color;
    const isTaken = taken.has(color) && !isMine;
    if (isMine) btn.classList.add("selected");
    if (isTaken) btn.classList.add("taken");
    btn.disabled = isTaken;
    btn.addEventListener("click", () => {
      db.ref(`rooms/${roomCode}/players/${myId}/profileColor`).set(color);
    });
    choices.appendChild(btn);
  });

  const readyCount = Object.values(players).filter((p) => p.ready).length;
  const total = Object.keys(players).length;
  const iAmReady = players[myId] && players[myId].ready;
  $("btn-ready").textContent = iAmReady ? "Ready ✓" : "I'm ready";
  $("btn-ready").onclick = () => {
    const p = players[myId];
    if (!p.profileColor && !p.token) return alert("Pick a profile color first!");
    db.ref(`rooms/${roomCode}/players/${myId}/ready`).set(!p.ready);
  };

  const isHost = myId === currentRoom.hostId;
  const canStart = isHost && total >= 2 && readyCount === total;
  $("btn-start-game").classList.toggle("hidden", !isHost);
  $("btn-start-game").disabled = !canStart;
  $("waiting-hint").textContent = isHost
    ? (canStart ? "Everyone is ready — start when you like!" : `Waiting: ${readyCount}/${total} ready (need everyone, 2-4 players).`)
    : `Waiting for host to start… (${readyCount}/${total} ready)`;
  $("btn-start-game").onclick = startGame;
}

$("btn-copy-link").addEventListener("click", () => {
  const url = `${location.origin}${location.pathname}?room=${roomCode}`;
  navigator.clipboard?.writeText(url);
  $("btn-copy-link").textContent = "Link copied!";
  setTimeout(() => ($("btn-copy-link").textContent = "Copy invite link"), 1500);
});

async function startGame() {
  const players = currentRoom.players;
  const order = Object.keys(players).sort((a, b) => players[a].joinOrder - players[b].joinOrder);
  const updates = {
    status: "playing",
    order,
    turn: 0,
    diceRolled: false,
    doublesCount: 0,
    dice: [1, 1],
    ownership: {},
    pendingDecision: null,
    winner: null,
  };
  order.forEach((id) => {
    updates[`players/${id}/money`] = START_MONEY;
    updates[`players/${id}/position`] = 0;
    updates[`players/${id}/inJail`] = false;
    updates[`players/${id}/out`] = false;
  });
  await roomRef.update(updates);
  await pushLog("The game begins! " + order.map((id) => players[id].name).join(", ") + " are playing.");
}

// ============================================================
// GAME SCREEN
// ============================================================
let boardBuilt = false;

function renderGameScreen() {
  showScreen("game");
  $("topbar-room-code").textContent = roomCode;
  if (!boardBuilt) { buildBoard(); boardBuilt = true; }

  const players = currentRoom.players;
  const order = currentRoom.order;
  const turnPlayerId = order[currentRoom.turn];
  const isMyTurn = turnPlayerId === myId;

  renderPlayerList(players, order, turnPlayerId);
  renderTokensOnBoard(players, order);
  renderOwnership(players);

  $("die1").textContent = currentRoom.dice[0];
  $("die2").textContent = currentRoom.dice[1];

  const me = players[myId];
  const banner = $("turn-banner");
  if (me && me.out) {
    banner.textContent = "You're out of the game — spectating.";
  } else {
    banner.textContent = isMyTurn ? "Your turn!" : `${players[turnPlayerId]?.name || "…"}'s turn`;
  }

  const pending = currentRoom.pendingDecision;
  const rollBtn = $("btn-roll");
  const endBtn = $("btn-end-turn");
  const actionBox = $("action-box");
  const buyBtn = $("btn-buy");
  const skipBtn = $("btn-skip-buy");
  const bailBtn = $("btn-pay-bail");

  rollBtn.classList.remove("hidden");
  endBtn.classList.add("hidden");
  actionBox.classList.add("hidden");
  buyBtn.classList.add("hidden");
  skipBtn.classList.add("hidden");
  bailBtn.classList.add("hidden");
  rollBtn.disabled = true;

  if (!isMyTurn || (me && me.out)) {
    rollBtn.textContent = "Roll dice";
  } else if (pending && pending.type === "buy") {
    actionBox.classList.remove("hidden");
    $("action-text").textContent = `Buy ${BOARD[pending.tileIndex].name} for ₹${BOARD[pending.tileIndex].price}?`;
    buyBtn.classList.remove("hidden");
    skipBtn.classList.remove("hidden");
  } else if (me.inJail && !currentRoom.diceRolled) {
    actionBox.classList.remove("hidden");
    $("action-text").textContent = "You're in jail. Pay ₹200 bail or try rolling doubles.";
    bailBtn.classList.remove("hidden");
    rollBtn.disabled = false;
    rollBtn.textContent = "Try rolling doubles";
  } else if (!currentRoom.diceRolled) {
    rollBtn.disabled = false;
    rollBtn.textContent = "Roll dice";
  } else {
    endBtn.classList.remove("hidden");
  }

  renderLog();
}

function buildBoard() {
  const board = $("board");
  board.innerHTML = "";
  BOARD.forEach((tile) => {
    const pos = tilePos(tile.i);
    const div = document.createElement("div");
    div.className = "tile" + (["go", "jail", "parking", "gotojail"].includes(tile.type) ? " corner" : "");
    div.style.gridRow = pos.row;
    div.style.gridColumn = pos.col;
    div.id = "tile-" + tile.i;

    let priceLine = "";
    if (tile.type === "property" || tile.type === "transport") priceLine = `₹${tile.price}`;
    if (tile.type === "tax") priceLine = `Pay ₹${tile.amount}`;

    div.innerHTML = `
      ${tile.group ? `<div class="group-bar" style="background:${GROUP_COLORS[tile.group]}"></div>` : ""}
      <div class="tile-emoji">${tile.emoji}</div>
      <div class="tile-name">${tile.name}</div>
      ${priceLine ? `<div class="tile-price">${priceLine}</div>` : ""}
    `;
    board.appendChild(div);
  });
  const center = document.createElement("div");
  center.className = "board-center";
  center.textContent = "കയലോരങ്ങൾ";
  board.appendChild(center);
}

function tilePos(i) {
  if (i <= 7) return { row: 8, col: 8 - i };
  if (i <= 14) return { row: 8 - (i - 7), col: 1 };
  if (i <= 21) return { row: 1, col: 1 + (i - 14) };
  return { row: 1 + (i - 21), col: 8 };
}

function renderTokensOnBoard(players, order) {
  document.querySelectorAll(".token-dot").forEach((el) => el.remove());
  const grouped = {};
  order.forEach((id) => {
    const p = players[id];
    if (!p || p.out) return;
    grouped[p.position] = grouped[p.position] || [];
    grouped[p.position].push(p);
  });
  Object.entries(grouped).forEach(([posIdx, ps]) => {
    const tileEl = $("tile-" + posIdx);
    if (!tileEl) return;
    ps.forEach((p, k) => {
      const dot = document.createElement("div");
      dot.className = "token-dot";
      const playerId = order.find((id) => players[id] === p);
      dot.style.backgroundColor = playerColor(playerId, order);
      dot.title = p.name;
      dot.style.left = 4 + (k % 3) * 15 + "px";
      dot.style.top = 4 + Math.floor(k / 3) * 15 + "px";
      tileEl.appendChild(dot);
    });
  });
}

function renderOwnership(players) {
  document.querySelectorAll(".tile-owner-dot").forEach((el) => el.remove());
  const ownership = currentRoom.ownership || {};
  Object.entries(ownership).forEach(([tileIdx, ownerId]) => {
    const tileEl = $("tile-" + tileIdx);
    if (!tileEl || !players[ownerId]) return;
    const dot = document.createElement("div");
    dot.className = "tile-owner-dot";
    dot.style.right = "3px";
    dot.style.background = "#333";
    dot.title = players[ownerId].name;
    dot.textContent = "";
    dot.style.setProperty("background", playerColor(ownerId, currentRoom.order));
    tileEl.appendChild(dot);
  });
}

function playerColor(id, order) {
  const player = currentRoom?.players?.[id];
  if (player?.profileColor) return player.profileColor;
  return LEGACY_PROFILE_COLORS[Math.max(0, order.indexOf(id)) % LEGACY_PROFILE_COLORS.length];
}

function renderPlayerList(players, order, turnPlayerId) {
  const ul = $("player-list");
  ul.innerHTML = "";
  order.forEach((id) => {
    const p = players[id];
    if (!p) return;
    const li = document.createElement("li");
    if (id === turnPlayerId) li.classList.add("current-turn");
    const avatar = document.createElement("span");
    avatar.className = "profile-avatar";
    avatar.textContent = p.name.trim().charAt(0).toUpperCase();
    avatar.style.backgroundColor = playerColor(id, order);
    const name = document.createElement("span");
    name.className = p.out ? "player-name p-out" : "player-name";
    name.textContent = `${p.name}${p.inJail ? " (in jail)" : ""}${id === currentRoom.hostId ? " · Host" : ""}`;
    const money = document.createElement("span");
    money.className = "p-money";
    money.textContent = p.out ? "OUT" : `₹${p.money}`;
    li.append(avatar, name, money);
    if (myId === currentRoom.hostId && id !== myId) li.appendChild(makeRemoveButton(id, p.name));
    ul.appendChild(li);
  });
}

function renderLog() {
  const box = $("game-log");
  const entries = currentRoom.log ? Object.values(currentRoom.log).sort((a, b) => b.ts - a.ts).slice(0, 30) : [];
  box.innerHTML = entries.map((e) => `<div>${escapeHtml(e.text)}</div>`).join("");
}

async function pushLog(text) {
  await roomRef.child("log").push({ text, ts: Date.now() });
}

// ============================================================
// TURN ACTIONS
// ============================================================
$("btn-roll").addEventListener("click", async () => {
  $("btn-roll").disabled = true;
  const players = currentRoom.players;
  const me = players[myId];
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  const isDouble = d1 === d2;

  if (me.inJail) {
    if (isDouble) {
      await roomRef.update({ dice: [d1, d2], [`players/${myId}/inJail`]: false, [`players/${myId}/jailTurns`]: 0 });
      await pushLog(`${me.name} rolled a double and got out of jail!`);
      await movePlayer(myId, d1 + d2);
    } else {
      const jt = (me.jailTurns || 0) + 1;
      if (jt >= 3) {
        await roomRef.update({ dice: [d1, d2], [`players/${myId}/inJail`]: false, [`players/${myId}/jailTurns`]: 0 });
        await pushLog(`${me.name} served their time and is free.`);
        await movePlayer(myId, d1 + d2);
      } else {
        await roomRef.update({ dice: [d1, d2], [`players/${myId}/jailTurns`]: jt, diceRolled: true });
        await pushLog(`${me.name} stayed in jail (attempt ${jt}/3).`);
      }
    }
    return;
  }

  await roomRef.update({ dice: [d1, d2], diceRolled: true });
  if (isDouble) {
    const dc = (currentRoom.doublesCount || 0) + 1;
    if (dc >= 3) {
      await roomRef.update({ doublesCount: 0 });
      await sendToJail(myId);
      await pushLog(`${me.name} rolled doubles three times — straight to jail!`);
      return;
    }
    await roomRef.update({ doublesCount: dc });
  } else {
    await roomRef.update({ doublesCount: 0 });
  }
  await movePlayer(myId, d1 + d2, isDouble);
});

async function movePlayer(id, steps, allowReroll) {
  const players = currentRoom.players;
  const p = players[id];
  const oldPos = p.position;
  const newPos = (oldPos + steps) % BOARD.length;
  const passedGo = newPos < oldPos || (oldPos + steps) >= BOARD.length;
  let position = oldPos;
  for (let step = 0; step < steps; step++) {
    position = (position + 1) % BOARD.length;
    const updates = { [`players/${id}/position`]: position };
    if (position === 0) updates[`players/${id}/money`] = p.money + PASS_GO_BONUS;
    await roomRef.update(updates);
    if (step < steps - 1) await new Promise((resolve) => setTimeout(resolve, 110));
  }
  if (passedGo) await pushLog(`${p.name} passed GO and collected ₹${PASS_GO_BONUS}.`);
  await pushLog(`${p.name} rolled and moved to ${BOARD[newPos].name}.`);
  await resolveTile(id, newPos, allowReroll);
}

async function resolveTile(id, tileIndex, allowReroll) {
  const tile = BOARD[tileIndex];
  const players = (await roomRef.child("players").get()).val();
  const ownership = (await roomRef.child("ownership").get()).val() || {};
  const p = players[id];

  if (tile.type === "property" || tile.type === "transport") {
    const ownerId = ownership[tileIndex];
    if (!ownerId) {
      if (p.money >= tile.price) {
        await roomRef.update({ pendingDecision: { type: "buy", tileIndex, playerId: id, allowReroll: Boolean(allowReroll) } });
        return;
      }
      await pushLog(`${p.name} cannot afford ${tile.name}; the property is passed.`);
      return finishResolution(allowReroll);
    } else if (ownerId !== id) {
      await payRent(id, ownerId, tile.rent, tile.name);
    }
  } else if (tile.type === "tax") {
    await chargePlayer(id, tile.amount, `${p.name} paid ₹${tile.amount} for ${tile.name}.`);
  } else if (tile.type === "chest") {
    const card = SURPRISE_CARDS[Math.floor(Math.random() * SURPRISE_CARDS.length)];
    await pushLog(`${p.name} drew: ${card.text}`);
    if (card.toJail) { await sendToJail(id); return finishResolution(allowReroll); }
    if (typeof card.moveTo === "number") {
      await roomRef.update({ [`players/${id}/position`]: card.moveTo });
      return resolveTile(id, card.moveTo, allowReroll);
    }
    if (card.money) {
      if (card.money > 0) await roomRef.update({ [`players/${id}/money`]: p.money + card.money });
      else await chargePlayer(id, -card.money, null);
    }
  } else if (tile.type === "gotojail") {
    await sendToJail(id);
    return finishResolution(allowReroll);
  }
  await finishResolution(allowReroll);
}

async function finishResolution(allowReroll) {
  if (allowReroll) {
    await roomRef.update({ diceRolled: false });
  }
}

async function sendToJail(id) {
  await roomRef.update({ [`players/${id}/position`]: JAIL_INDEX, [`players/${id}/inJail`]: true, [`players/${id}/jailTurns`]: 0 });
}

async function chargePlayer(id, amount, logText) {
  const snap = await roomRef.child(`players/${id}`).get();
  const p = snap.val();
  const newMoney = p.money - amount;
  await roomRef.child(`players/${id}/money`).set(newMoney);
  if (logText) await pushLog(logText);
  if (newMoney < 0) await handleBankruptcy(id, null);
}

async function payRent(payerId, ownerId, amount, propName) {
  const players = (await roomRef.child("players").get()).val();
  const payer = players[payerId], owner = players[ownerId];
  const newPayerMoney = payer.money - amount;
  await roomRef.update({
    [`players/${payerId}/money`]: newPayerMoney,
    [`players/${ownerId}/money`]: owner.money + amount,
  });
  await pushLog(`${payer.name} paid ₹${amount} rent to ${owner.name} for ${propName}.`);
  if (newPayerMoney < 0) await handleBankruptcy(payerId, ownerId);
}

async function handleBankruptcy(loserId, creditorId) {
  const players = (await roomRef.child("players").get()).val();
  await roomRef.update({ [`players/${loserId}/out`]: true, [`players/${loserId}/money`]: 0 });
  await pushLog(`💥 ${players[loserId].name} is bankrupt and out of the game!`);

  // release / transfer their properties
  const ownership = (await roomRef.child("ownership").get()).val() || {};
  const updates = {};
  Object.entries(ownership).forEach(([tileIdx, ownerId]) => {
    if (ownerId === loserId) updates[`ownership/${tileIdx}`] = creditorId || null;
  });
  if (Object.keys(updates).length) await roomRef.update(updates);

  const remaining = Object.entries(players).filter(([id, p]) => id !== loserId && !p.out);
  if (remaining.length <= 1) {
    const winnerId = remaining[0]?.[0];
    await roomRef.update({ status: "over", winner: winnerId });
  }
}

$("btn-buy").addEventListener("click", async () => {
  const pending = currentRoom.pendingDecision;
  if (!pending || pending.playerId !== myId) return;
  const tile = BOARD[pending.tileIndex];
  const p = currentRoom.players[myId];
  if (!p || p.money < tile.price) return;
  await roomRef.update({
    [`players/${myId}/money`]: p.money - tile.price,
    [`ownership/${pending.tileIndex}`]: myId,
    pendingDecision: null,
  });
  await pushLog(`${p.name} bought ${tile.name} for ₹${tile.price}.`);
  await finishResolution(pending.allowReroll);
});

$("btn-skip-buy").addEventListener("click", async () => {
  const pending = currentRoom.pendingDecision;
  if (!pending || pending.playerId !== myId) return;
  await roomRef.update({ pendingDecision: null });
  await pushLog(`${currentRoom.players[myId].name} chose not to buy.`);
  await finishResolution(pending.allowReroll);
});

$("btn-pay-bail").addEventListener("click", async () => {
  const p = currentRoom.players[myId];
  if (p.money < 200) return alert("Not enough money for bail!");
  await roomRef.update({
    [`players/${myId}/money`]: p.money - 200,
    [`players/${myId}/inJail`]: false,
    [`players/${myId}/jailTurns`]: 0,
  });
  await pushLog(`${p.name} paid ₹200 bail and is free.`);
});

$("btn-end-turn").addEventListener("click", async () => {
  const order = currentRoom.order;
  let next = (currentRoom.turn + 1) % order.length;
  let guard = 0;
  while (currentRoom.players[order[next]].out && guard++ < order.length) {
    next = (next + 1) % order.length;
  }
  await roomRef.update({ turn: next, diceRolled: false, dice: [1, 1], doublesCount: 0 });
});

// ============================================================
// GAME OVER
// ============================================================
function renderGameOver() {
  showScreen("over");
  const winner = currentRoom.players[currentRoom.winner];
  $("winner-text").textContent = winner ? `${winner.name} wins the game!` : "Game over.";
}
$("btn-new-game").addEventListener("click", () => {
  sessionStorage.removeItem("kay_room");
  location.href = location.pathname;
});

// ============================================================
// CHAT
// ============================================================
$("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("chat-input");
  const text = input.value.trim();
  if (!text || !roomRef) return;
  input.value = "";
  await roomRef.child("chat").push({ name: myName, text, ts: Date.now() });
});

function appendChatMessage(msg) {
  const box = $("chat-messages");
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<strong>${escapeHtml(msg.name)}:</strong> ${escapeHtml(msg.text)}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

// ============================================================
// MOBILE PANEL TOGGLES
// ============================================================
$("btn-toggle-players").addEventListener("click", () => {
  $("panel-players").classList.toggle("open");
  $("panel-chat").classList.remove("open");
});
$("btn-toggle-chat").addEventListener("click", () => {
  $("panel-chat").classList.toggle("open");
  $("panel-players").classList.remove("open");
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
