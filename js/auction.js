// ══════════════════════════════════════════
// AUCTION.JS — Lógica central de subasta
// ══════════════════════════════════════════

// ── Helpers de posición ──

function currentPos()        { return state.positionOrder[state.currentPosIdx]; }
function currentPool()       { return state.pool[currentPos()] || []; }
function currentPlayerData() { return currentPool()[state.currentPlayerIdx]; }

function getPosLabel(pos) {
  return {
    GK:     'Portero',
    RB:     'Lateral Derecho',
    RCB:    'Central Derecho',
    LCB:    'Central Izquierdo',
    LB:     'Lateral Izquierdo',
    MedioI: 'Mediocampista Izquierdo',
    MedioC: 'Mediocampista Centro',
    MedioD: 'Mediocampista Derecho',
    RW:     'Extremo Derecho',
    LW:     'Extremo Izquierdo',
    ST:     'Delantero Centro',
  }[pos];
}

// ── Arranque ──

function launchAuction() {
  state.currentPosIdx    = 0;
  state.currentPlayerIdx = 0;
  state.auctionLog       = [];
  state.auctionFinished  = false;

  document.getElementById('btn-auction').disabled    = false;
  document.getElementById('btn-formations').disabled = false;
  switchTab('auction');
  loadNextPlayer();
}

// ── Carga del siguiente jugador ──

function loadNextPlayer() {
  const pos     = currentPos();
  const posInfo = POSITIONS_433.find(p => p.key === pos);
  const spotsNeeded = posInfo.count;

  // ¿Todos llenaron esta posición?
  const allFilled = state.players.every(p => p.team[pos].length >= spotsNeeded);
  if (allFilled) {
    if (shouldInitiateTrade()) { openTradeModal(); return; }
    advancePosition(); return;
  }

  // ¿Se agotó el pool?
  const pool = currentPool();
  if (state.currentPlayerIdx >= pool.length) {
    if (shouldInitiateTrade()) { openTradeModal(); return; }
    advancePosition(); return;
  }

  const player = currentPlayerData();
  state.currentBid    = player.basePrice;
  state.currentLeader = null;
  state.extensionsUsed = 0;

  renderAuction();
  startTimer();
}

function advancePosition() {
  state.currentPosIdx++;
  state.currentPlayerIdx = 0;
  if (state.currentPosIdx >= state.positionOrder.length) { endAuction(); return; }
  loadNextPlayer();
}

// ── Timer ──

function startTimer() {
  clearInterval(state.timerInterval);
  state.timerLeft = TIMER_SECS;
  updateTimerUI();
  state.timerInterval = setInterval(() => {
    state.timerLeft--;
    updateTimerUI();
    if (state.timerLeft <= 0) {
      clearInterval(state.timerInterval);
      resolveAuction();
    }
  }, 1000);
}

function updateTimerUI() {
  const t    = state.timerLeft;
  const prog = document.getElementById('ring-prog');
  const text = document.getElementById('timer-text');
  if (!prog || !text) return;

  const offset = CIRCUMFERENCE * (1 - t / TIMER_SECS);
  prog.style.strokeDashoffset = offset;
  prog.style.stroke = t <= 5 ? 'var(--red)' : t <= 10 ? 'var(--gold)' : 'var(--green)';
  text.textContent  = t;
  text.style.color  = t <= 5 ? 'var(--red)' : 'var(--white)';
}

// ── Render de la vista de subasta ──

function renderAuction() {
  const pos     = currentPos();
  const player  = currentPlayerData();
  const pool    = currentPool();
  const extBtn  = document.getElementById('extend-btn');
  const extsLeft = MAX_EXTENSIONS - state.extensionsUsed;

  extBtn.disabled  = extsLeft <= 0;
  extBtn.textContent = extsLeft > 0
    ? `⏱ +${EXTEND_SECS}s (${extsLeft} uso${extsLeft !== 1 ? 's' : ''})`
    : 'Sin tiempos extra';

  document.getElementById('curr-pos-badge').textContent =
    `⬤ ${getPosLabel(pos).toUpperCase()}S`;
  document.getElementById('pool-info-text').textContent =
    `Jugador ${state.currentPlayerIdx + 1} de ${pool.length} disponibles`;

  // Foto / silueta
  const silWrap = document.getElementById('sil-wrap');
  silWrap.innerHTML = '';
  if (player.photo) {
    const img = document.createElement('img');
    img.src = player.photo; img.className = 'silhouette-img'; img.alt = 'Silueta';
    img.onerror = () => { silWrap.innerHTML = '<div class="silhouette-placeholder">👤</div>'; };
    silWrap.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'silhouette-placeholder';
    ph.textContent = { GK:'🧤', RB:'🛡', RCB:'🛡', LCB:'🛡', LB:'🛡',
      MedioI:'⚡', MedioC:'⚡', MedioD:'⚡', RW:'⚽', LW:'⚽', ST:'⚽' }[pos];
    silWrap.appendChild(ph);
  }

  document.getElementById('curr-price-display').textContent = state.currentBid;
  document.getElementById('player-revealed').classList.remove('show');

  // Botón skip
  const skipBtn  = document.getElementById('skip-btn');
  const skipCount = state.positionSkips[pos] || 0;
  skipBtn.disabled    = state.currentLeader !== null || !player || skipCount >= 2;
  skipBtn.textContent = skipCount >= 2
    ? 'Límite de saltos alcanzado'
    : '⏭ Saltar jugador (nadie oferta)';

  renderPoolRemaining();
  renderBidders();
  renderBalances();
  renderLog();
}

function renderBidders() {
  const list    = document.getElementById('bidders-list');
  list.innerHTML = '';
  const nextBid = state.currentLeader !== null ? state.currentBid + 5 : state.currentBid;

  state.players.forEach((p, i) => {
    const pos      = currentPos();
    const posInfo  = POSITIONS_433.find(pp => pp.key === pos);
    const alreadyFilled = p.team[pos].length >= posInfo.count;

    const remainingSlots = state.positionOrder.slice(state.currentPosIdx).reduce((acc, pk) => {
      const pi     = POSITIONS_433.find(pp => pp.key === pk);
      const filled = p.team[pk].length;
      return acc + Math.max(0, pi.count - filled);
    }, 0);
    const minNeeded = Math.max(0, remainingSlots - 1) * 5;
    const canAfford = p.balance - nextBid >= minNeeded;
    const isLeader  = state.currentLeader === i;
    const cantBid   = alreadyFilled || !canAfford || isLeader;

    const row = document.createElement('div');
    row.className = `bidder-row${isLeader ? ' leading' : ''}${(!canAfford || alreadyFilled) ? ' cant-afford' : ''}`;
    row.innerHTML = `
      <div class="bidder-dot" style="background:${p.color}"></div>
      <div class="bidder-name">${p.name}${alreadyFilled ? ' <span style="font-size:0.7rem;color:var(--muted)">(posición llena)</span>' : ''}</div>
      <div class="bidder-balance">${p.balance}M</div>
      <div class="bidder-current-bid">${isLeader ? `${state.currentBid}M <span class="leading-crown">👑</span>` : ''}</div>
      <button class="bidder-bid-btn" data-idx="${i}" ${cantBid ? 'disabled' : ''}>
        ${isLeader ? 'Líder' : `Pujar ${nextBid}M`}
      </button>`;
    list.appendChild(row);
  });

  list.querySelectorAll('.bidder-bid-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => placeBid(parseInt(btn.dataset.idx)));
  });
}

// ── Pujas ──

function placeBid(playerIdx) {
  const nextBid = state.currentLeader !== null ? state.currentBid + 5 : state.currentBid;
  const player  = state.players[playerIdx];
  if (player.balance < nextBid) { showNotif('¡No tenés suficiente presupuesto!'); return; }

  state.currentBid    = nextBid;
  state.currentLeader = playerIdx;

  clearInterval(state.timerInterval);
  state.timerLeft = TIMER_SECS;
  updateTimerUI();
  state.timerInterval = setInterval(() => {
    state.timerLeft--;
    updateTimerUI();
    if (state.timerLeft <= 0) { clearInterval(state.timerInterval); resolveAuction(); }
  }, 1000);

  document.getElementById('curr-price-display').textContent = state.currentBid;
  state.auctionLog.unshift({ type: 'bid', player: player.name, amount: state.currentBid, color: player.color });
  renderBidders();
  renderLog();
  showNotif(`${player.name} oferta ${state.currentBid}M`);
}

function buyNow(playerIdx) {
  const player    = state.players[playerIdx];
  const buyPrice  = state.currentBid + BUY_NOW_PREMIUM;
  const finalPrice = state.currentLeader === playerIdx ? state.currentBid : buyPrice;

  if (player.balance < finalPrice) { showNotif('No tenés presupuesto para la compra directa'); return; }

  clearInterval(state.timerInterval);
  state.currentBid    = finalPrice;
  state.currentLeader = playerIdx;
  resolveAuction();
}

// ── Resolución de subasta ──

function resolveAuction() {
  clearInterval(state.timerInterval);
  const playerData = currentPlayerData();
  const pos        = currentPos();

  if (state.currentLeader === null) {
    const skipCount = state.positionSkips[pos] || 0;

    if (skipCount < 2) {
      state.positionSkips[pos] = skipCount + 1;
      addLog({ type: 'skip', playerName: playerData.name });
      showNotif(`${playerData.name} saltado — nadie ofertó`);
      showReveal(null, playerData, 0, () => {
        state.currentPlayerIdx++;
        setTimeout(loadNextPlayer, 200);
      }, true);
      return;
    }

    // Límite de saltos: asignar automáticamente
    const posInfo     = POSITIONS_433.find(p => p.key === pos);
    const eligible    = state.players.filter(p => p.team[pos].length < posInfo.count);
    const winner      = eligible.find(p => p.balance >= playerData.basePrice) || eligible[0] || state.players[0];
    winner.team[pos].push({ ...playerData, pricePaid: playerData.basePrice });
    winner.balance -= playerData.basePrice;
    addLog({ type: 'auto', winner: winner.name, playerName: playerData.name, amount: playerData.basePrice, color: winner.color });
    showReveal(winner, playerData, playerData.basePrice, () => {
      state.currentPlayerIdx++;
      state.currentLeader = null;
      loadNextPlayer();
    });
    return;
  }

  const winner = state.players[state.currentLeader];
  winner.team[pos].push({ ...playerData, pricePaid: state.currentBid });
  winner.balance -= state.currentBid;
  addLog({ type: 'won', winner: winner.name, playerName: playerData.name, amount: state.currentBid, color: winner.color });

  showReveal(winner, playerData, state.currentBid, () => {
    state.currentPlayerIdx++;
    state.currentLeader = null;
    loadNextPlayer();
  });
}

// ── Reveal overlay ──

function showReveal(winner, playerData, price, callback, skipped = false) {
  const overlay      = document.getElementById('reveal-overlay');
  const label        = document.querySelector('.reveal-box .winner-label');
  const revWinner    = document.getElementById('rev-winner');
  const revPlayerName = document.getElementById('rev-player-name');
  const revMeta      = document.getElementById('rev-player-meta');
  const revPrice     = document.getElementById('rev-price-paid');

  if (skipped) {
    label.textContent = 'Jugador saltado';
    label.style.color = 'var(--muted)';
    revWinner.textContent = '';
    revPlayerName.textContent = playerData.name;
    revMeta.textContent  = `${playerData.club} · ${playerData.nationality}`;
    revPrice.textContent = 'Nadie ofertó';
  } else {
    label.textContent = '¡GANÓ LA SUBASTA!';
    label.style.color = '';
    revWinner.textContent = winner.name;
    revWinner.style.color = winner.color;
    revPlayerName.textContent = playerData.name;
    revMeta.textContent  = `${playerData.club} · ${playerData.nationality}`;
    revPrice.textContent = `${price}M pagados`;
  }

  const wrap = document.getElementById('rev-photo-wrap');
  wrap.innerHTML = '';
  if (playerData.photo) {
    const img = document.createElement('img');
    img.src = playerData.photo; img.className = 'player-photo'; img.alt = playerData.name;
    img.onerror = () => { wrap.textContent = '⚽'; wrap.className = 'player-photo-placeholder'; };
    wrap.className = ''; wrap.appendChild(img);
  } else {
    wrap.className = 'player-photo-placeholder'; wrap.textContent = '⚽';
  }

  overlay.classList.add('show');
  const btn = document.getElementById('reveal-continue');
  const handler = () => { overlay.classList.remove('show'); btn.removeEventListener('click', handler); callback(); };
  btn.addEventListener('click', handler);
}

// ── Log ──

function addLog(entry) {
  state.auctionLog.unshift(entry);
  renderLog();
}

function renderLog() {
  const list = document.getElementById('log-list');
  list.innerHTML = state.auctionLog.slice(0, 20).map(e => {
    if (e.type === 'won')  return `<div class="log-item won"><strong style="color:${e.color}">${e.winner}</strong> ganó a <strong>${e.playerName}</strong> por ${e.amount}M</div>`;
    if (e.type === 'bid')  return `<div class="log-item"><strong style="color:${e.color}">${e.player}</strong> ofertó ${e.amount}M</div>`;
    if (e.type === 'skip') return `<div class="log-item">${e.playerName} → saltado</div>`;
    if (e.type === 'auto') return `<div class="log-item auto"><strong style="color:${e.color}">${e.winner}</strong> asignado automáticamente a <strong>${e.playerName}</strong> por ${e.amount}M</div>`;
    return '';
  }).join('');
}

// ── Balances y pool ──

function renderBalances() {
  const list = document.getElementById('balance-list');
  list.innerHTML = state.players.map(p => `
    <div class="balance-item">
      <div class="bidder-dot" style="background:${p.color};width:10px;height:10px;border-radius:50%;flex-shrink:0;"></div>
      <div class="b-name">${p.name}</div>
      <div class="balance-bar-wrap"><div class="balance-bar" style="width:${p.balance}%"></div></div>
      <div class="b-val">${p.balance}M</div>
    </div>`).join('');
}

function renderPoolRemaining() {
  const display = document.getElementById('pool-remaining-display');
  display.innerHTML = state.positionOrder.map((pos, i) => {
    const pool = state.pool[pos] || [];
    const remaining = pool.length - (
      state.currentPosIdx === i ? state.currentPlayerIdx :
      state.currentPosIdx >  i ? pool.length : 0
    );
    const isCurr = state.currentPosIdx === i;
    return `<div class="pool-pos-row${isCurr ? ' current-pos' : ''}">
      <span class="pos-label">${getPosLabel(pos)}s</span>
      <span class="pos-count">${Math.max(0, remaining)} restantes</span>
    </div>`;
  }).join('');
}

// ── Event listeners de subasta ──

document.getElementById('skip-btn').addEventListener('click', () => {
  const pos       = currentPos();
  const skipCount = state.positionSkips[pos] || 0;
  if (state.currentLeader !== null) { showNotif('Ya hay una oferta activa — el timer continúa'); return; }
  if (skipCount >= 2)               { showNotif('Ya alcanzaste el límite de 2 saltos en esta posición'); return; }
  clearInterval(state.timerInterval);
  const player = currentPlayerData();
  if (!player) return;
  state.positionSkips[pos] = skipCount + 1;
  addLog({ type: 'skip', playerName: player.name });
  showReveal(null, player, 0, () => {
    state.currentPlayerIdx++;
    setTimeout(loadNextPlayer, 200);
  }, true);
});

document.getElementById('extend-btn').addEventListener('click', () => {
  if (state.extensionsUsed >= MAX_EXTENSIONS) { showNotif('Ya se usaron todos los tiempos extra'); return; }
  state.timerLeft += EXTEND_SECS;
  state.extensionsUsed++;
  const remaining = MAX_EXTENSIONS - state.extensionsUsed;
  showNotif(`+${EXTEND_SECS}s agregados (${remaining} uso${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''})`);
  renderAuction();
});