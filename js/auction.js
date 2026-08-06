// ══════════════════════════════════════════
// AUCTION.JS — Lógica central de subasta
// ══════════════════════════════════════════

// ── Helpers de posición ──

function currentPos()        { return state.positionOrder[state.currentPosIdx]; }
function currentPool()       { return state.pool[currentPos()] || []; }
function currentPlayerData() { return currentPool()[state.currentPlayerIdx]; }

function isLastPlayerOfAuction() {
  const pool = currentPool();
  return state.currentPosIdx >= state.positionOrder.length - 1 && state.currentPlayerIdx >= pool.length - 1;
}

function getPosLabel(pos) {
  return {
    Arquero:                'Arquero',
    LateralDerecho:         'Lateral Derecho',
    CentralDerecho:         'Central Derecho',
    CentralIzquierdo:       'Central Izquierdo',
    LateralIzquierdo:       'Lateral Izquierdo',
    MediocampistaIzquierdo: 'Mediocampista Izquierdo',
    MediocampistaC:         'Mediocampista Centro',
    MediocampistaD:         'Mediocampista Derecho',
    ExtremoDerecho:         'Extremo Derecho',
    ExtremoIzquierdo:       'Extremo Izquierdo',
    DelanteroC:             'Delantero Centro',
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
}

function updateTimerUI() {
  return;
}

// ── Render de la vista de subasta ──

function canAnyoneAffordCurrentPlayer() {
  const pos = currentPos();
  if (!pos) return false;

  const currentPrice = state.currentLeader !== null ? state.currentBid : state.currentBid;

  return state.players.some(player => {
    const posInfo = POSITIONS_433.find(pp => pp.key === pos);
    if (!posInfo) return false;
    if (player.team[pos].length >= posInfo.count) return false;
    if (player.balance <= 0) return false;

    return player.balance >= currentPrice;
  });
}

function getAdvancePositionLabel() {
  if (state.currentPosIdx >= state.positionOrder.length - 1) {
    return '🏁 Terminar subasta';
  }

  const nextPos = state.positionOrder[state.currentPosIdx + 1];
  const nextLabel = getPosLabel(nextPos);
  return `⏭ Siguiente: ${nextLabel}`;
}

function renderAuction() {
  const pos     = currentPos();
  const player  = currentPlayerData();
  const pool    = currentPool();

  document.getElementById('curr-pos-badge').textContent =
    `${getPosLabel(pos).toUpperCase()}`;
  document.getElementById('pool-info-text').textContent =
    `Jugador ${state.currentPlayerIdx + 1} de ${pool.length} disponibles`;
  document.getElementById('price-note-pos').textContent =
    getPosLabel(pos).toUpperCase();

  // Foto / silueta
  const silWrap = document.getElementById('sil-wrap');
  silWrap.innerHTML = '';
  const placeholder = document.createElement('div');
  placeholder.className = 'silhouette-placeholder';
  placeholder.innerHTML = '<svg viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg"><path d="M32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16S16 24.8 16 16 23.2 0 32 0zm0 32c17.7 0 32 14.3 32 32v16H0V64c0-17.7 14.3-32 32-32z" fill="currentColor"/></svg>';
  silWrap.appendChild(placeholder);

  if (player.photo) {
    const img = document.createElement('img');
    img.className = 'silhouette-img';
    img.alt = 'Silueta';
    img.onload = () => {
      if (placeholder.parentElement) placeholder.replaceWith(img);
    };
    img.onerror = () => {
      img.remove();
    };
    img.src = player.photo.split('/').map(encodeURIComponent).join('/');
  }

  document.getElementById('curr-price-display').textContent = `${state.currentBid}M`;
  document.getElementById('player-revealed').classList.remove('show');

  // Botón skip
  const skipBtn  = document.getElementById('skip-btn');
  const advanceBtn = document.getElementById('advance-position-btn');
  const skipCount = state.positionSkips[pos] || 0;
  const noOneCanAfford = !!player && !canAnyoneAffordCurrentPlayer();

  skipBtn.disabled    = state.currentLeader !== null || !player || skipCount >= 2;
  skipBtn.textContent = skipCount >= 2
    ? 'Límite de saltos alcanzado'
    : '⏭ Saltar jugador (nadie oferta)';

  advanceBtn.style.display = noOneCanAfford && state.currentLeader === null ? 'block' : 'none';
  advanceBtn.textContent = getAdvancePositionLabel();

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

    const canAfford = p.balance > 0 && p.balance >= nextBid;
    const isLeader  = state.currentLeader === i;
    const cantBid   = alreadyFilled || !canAfford || isLeader;
    const buyPrice  = isLeader ? state.currentBid : nextBid;

    const row = document.createElement('div');
    row.className = `bidder-row${isLeader ? ' leading' : ''}${(!canAfford || alreadyFilled) ? ' cant-afford' : ''}`;
    const iconMarkup = p.icon
      ? `<div class="bidder-icon"><img src="${p.icon}" alt="${p.name}" /></div>`
      : `<div class="bidder-dot" style="background:${p.color}"></div>`;
    row.innerHTML = `
      ${iconMarkup}
      <div class="bidder-name">${p.name}${alreadyFilled ? ' <span style="font-size:0.7rem;color:var(--muted)">(posición llena)</span>' : ''}</div>
      <div class="bidder-balance">${p.balance}M</div>
      <div class="bidder-current-bid">${isLeader ? `${state.currentBid}M <span class="leading-crown">👑</span>` : ''}</div>
      <div class="bidder-actions">
        <button class="bidder-bid-btn" data-idx="${i}" ${cantBid ? 'disabled' : ''}>
          ${isLeader ? 'Líder' : `Pujar ${nextBid}M`}
        </button>
        <button class="buy-now-btn" data-buy-idx="${i}" ${alreadyFilled || p.balance < buyPrice ? 'disabled' : ''}>
          Comprar ${buyPrice}M
        </button>
      </div>`;
    list.appendChild(row);
  });

  list.querySelectorAll('.bidder-bid-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => placeBid(parseInt(btn.dataset.idx)));
  });

  list.querySelectorAll('.buy-now-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => buyNow(parseInt(btn.dataset.buyIdx)));
  });
}

// ── Pujas ──

function placeBid(playerIdx) {
  const nextBid = state.currentLeader !== null ? state.currentBid + 5 : state.currentBid;
  const player  = state.players[playerIdx];
  if (player.balance < nextBid) { showNotif('¡No tenés suficiente presupuesto!'); return; }

  state.currentBid    = nextBid;
  state.currentLeader = playerIdx;

  document.getElementById('curr-price-display').textContent = `${state.currentBid}M`;
  state.auctionLog.unshift({ type: 'bid', player: player.name, amount: state.currentBid, color: player.color });
  renderBidders();
  renderLog();
  showNotif(`${player.name} oferta ${state.currentBid}M`);
}

function buyNow(playerIdx) {
  const player    = state.players[playerIdx];
  const finalPrice = state.currentLeader === playerIdx ? state.currentBid : (state.currentLeader !== null ? state.currentBid + 5 : state.currentBid);

  if (player.balance < finalPrice) { showNotif('No tenés presupuesto para la compra directa'); return; }

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
    const winner      = eligible.find(p => p.balance >= playerData.basePrice);

    if (!winner) {
      addLog({ type: 'skip', playerName: playerData.name });
      showNotif(`${playerData.name} se salta porque nadie puede pagar su precio base.`);
      showReveal(null, playerData, 0, () => {
        state.currentPlayerIdx++;
        state.currentLeader = null;
        loadNextPlayer();
      }, true);
      return;
    }

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
  if (winner.balance < state.currentBid) {
    addLog({ type: 'skip', playerName: playerData.name });
    showNotif(`${winner.name} no tiene suficiente presupuesto. Se salta este jugador.`);
    showReveal(null, playerData, 0, () => {
      state.currentPlayerIdx++;
      state.currentLeader = null;
      loadNextPlayer();
    }, true);
    return;
  }

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

function encodeImagePath(...parts) {
  return parts.map(part => part.split('/').map(encodeURIComponent).join('/')).join('/');
}

function getClubShieldPath(clubName) {
  if (!clubName) return '';

  const clubImageAliases = {
    'Atletico de Madrid': 'Atlético de Madrid',
    'AS Roma': 'Roma',
    'AC Milan': 'Milan',
    'A. C. Milan': 'Milan',
    'Newcastle United': 'Newcastle',
    'NewCastle': 'Newcastle',
    'Porto': 'FC Porto',
    'Dínamo de Moscú': 'Dinamo Moscú',
    'Inter de Milan': 'Inter Milan',
    'Inter': 'Inter Milan',
    'Olympique Marsella': 'Olympique de Marsella',
  };

  const imageName = clubImageAliases[clubName] || clubName;
  return encodeImagePath('Imagenes', 'Escudos', `${imageName}.png`);
}

function getCountryFlagPath(playerData) {
  const country = playerData?.nationality || playerData?.nat || playerData?.country || playerData?.pais || '';
  if (!country) return '';
  return encodeImagePath('Imagenes', 'Banderas', `${country}.png`);
}

function getPlayerBrandingHtml(playerData) {
  const clubName = playerData?.club || '';
  const country = playerData?.nationality || playerData?.nat || playerData?.country || playerData?.pais || '';
  const items = [];

  if (clubName) {
    const clubImg = getClubShieldPath(clubName);
    items.push(`
      <div class="player-info-item">
        <div class="player-info-icon-wrap"><img src="${clubImg}" alt="${clubName} escudo" class="player-info-icon" onerror="this.closest('.player-info-item').classList.add('no-icon'); this.remove();" /></div>
        <span>${clubName}</span>
      </div>
    `);
  }

  if (country) {
    const countryImg = getCountryFlagPath(playerData);
    items.push(`
      <div class="player-info-item">
        <div class="player-info-icon-wrap"><img src="${countryImg}" alt="${country} bandera" class="player-info-icon" onerror="this.closest('.player-info-item').classList.add('no-icon'); this.remove();" /></div>
        <span>${country}</span>
      </div>
    `);
  }

  return items.join('');
}

function getPlayerMetaText(playerData) {
  const club = playerData?.club || '';
  const country = playerData?.nationality || playerData?.nat || playerData?.country || playerData?.pais || '';
  const parts = [club, country].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Sin información';
}

function showReveal(winner, playerData, price, callback, skipped = false) {
  if (isLastPlayerOfAuction()) {
    callback();
    return;
  }

  const overlay      = document.getElementById('reveal-overlay');
  const label        = document.querySelector('.reveal-box .winner-label');
  const revPlayerName = document.getElementById('rev-player-name');
  const revPlayerLegend = document.getElementById('rev-player-legend');
  const revBranding   = document.getElementById('rev-player-branding');
  const revPrice     = document.getElementById('rev-price-paid');
  const revConfetti  = document.getElementById('rev-confetti');

  const isLegend = playerData && typeof playerData.tipo === 'string' && playerData.tipo.toLowerCase() === 'leyenda';
  revPlayerLegend.textContent = isLegend ? 'Leyenda' : '';
  revPlayerLegend.style.display = isLegend ? 'block' : 'none';

  if (skipped) {
    label.textContent = 'Jugador saltado';
    label.style.color = 'var(--muted)';
    revPlayerName.textContent = playerData.name;
    revBranding.innerHTML = getPlayerBrandingHtml(playerData);
    revBranding.style.display = revBranding.innerHTML ? 'flex' : 'none';
    revPrice.textContent = 'Nadie ofertó';
    revConfetti.innerHTML = '<i data-lucide="chevron-last"></i>';
  } else {
    label.textContent = '¡GANÓ LA SUBASTA!';
    label.style.color = '';
    revPlayerName.textContent = playerData.name;
    revBranding.innerHTML = getPlayerBrandingHtml(playerData);
    revBranding.style.display = revBranding.innerHTML ? 'flex' : 'none';
    revPrice.textContent = `${price}M pagados`;
    revConfetti.innerHTML = '<i data-lucide="trophy"></i>';
  }

  lucide.createIcons();

  const branding = document.getElementById('rev-player-branding');
  branding.innerHTML = getPlayerBrandingHtml(playerData);
  branding.style.display = branding.innerHTML ? 'flex' : 'none';

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
      ${p.icon
        ? `<div class="balance-icon"><img src="${p.icon}" alt="${p.name}" /></div>`
        : `<div class="bidder-dot" style="background:${p.color};width:10px;height:10px;border-radius:50%;flex-shrink:0;"></div>`}
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
      <span class="pos-label">${getPosLabel(pos)}</span>
      <span class="pos-count">${Math.max(0, remaining)} ${remaining === 1 ? 'restante' : 'restantes'}</span>
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

document.getElementById('advance-position-btn').addEventListener('click', () => {
  const pos = currentPos();
  const player = currentPlayerData();
  if (!player) return;
  if (state.currentLeader !== null) { showNotif('Ya hay una oferta activa'); return; }

  state.positionSkips[pos] = (state.positionSkips[pos] || 0) + 1;
  addLog({ type: 'skip', playerName: player.name });
  showReveal(null, player, 0, () => {
    if (state.currentPosIdx >= state.positionOrder.length - 1) {
      endAuction();
    } else {
      advancePosition();
    }
  }, true);
});