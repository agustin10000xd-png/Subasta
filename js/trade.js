// ══════════════════════════════════════════
// TRADE.JS — Rondas de intercambio
// ══════════════════════════════════════════
function getTradeRoundLabel(round) {
  return ['Arqueros', 'Defensores', 'Mediocampistas', 'Delanteros'][round];
}

function getPositionsForTradeRound(round) {
  const roundGroups = [
    ['Arquero'],
    ['LateralDerecho', 'CentralDerecho', 'CentralIzquierdo', 'LateralIzquierdo'],
    ['MediocampistaIzquierdo', 'MediocampistaC', 'MediocampistaD'],
    ['ExtremoDerecho', 'ExtremoIzquierdo', 'DelanteroC'],
  ];
  return roundGroups[round] || [];
}

function shouldInitiateTrade() {
  // Índice de la ÚLTIMA posición de cada ronda (GK=0, LB=4, MedioD=7, ST=10)
  const tradeCheckpoints = [0, 4, 7, 10];
  return state.currentPosIdx === tradeCheckpoints[state.tradeRound];
}

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
}

let tradeSelection = {};

function getTradeEntriesForPosition(posId) {
  return state.players.flatMap((player, playerIdx) =>
    (player.team[posId] || []).map((card, slotIdx) => ({
      posId,
      playerIdx,
      slotIdx,
      owner: player.name,
      name: card.name,
      club: card.club,
      pricePaid: card.pricePaid,
      photo: card.photo || player.photo || card.icon || player.icon,
    }))
  );
}

function getTradeMoneyInfo(selected, entry) {
  const diff = entry.pricePaid - selected.pricePaid;
  if (diff > 0) {
    return { text: `+${diff}M`, cls: 'trade-pay' };
  }
  if (diff < 0) {
    return { text: `${diff}M`, cls: 'trade-receive' };
  }
  return { text: '0', cls: 'trade-neutral' };
}

function openTradeModal() {
  const modal   = document.getElementById('trade-modal');
  const content = document.getElementById('trade-content');

  state.tradeMode   = true;
  state.timerPaused = true;
  clearInterval(state.timerInterval);

  const positionsInRound = getPositionsForTradeRound(state.tradeRound);
  const positionBlocks = positionsInRound
    .map(pos => {
      const entries = getTradeEntriesForPosition(pos);
      if (!entries.length) return '';
      return `
        <div class="position-block">
          <div class="position-head">
            <div class="position-index">${positionsInRound.indexOf(pos) + 1}</div>
            <div class="position-name">${getPosLabel(pos)}</div>
            <div class="position-line"></div>
          </div>
          <div class="player-grid" data-pos="${pos}"></div>
        </div>`;
    })
    .filter(Boolean);

  let html = `
    <div class="round-head">
      <h2 id="trade-round-title" class="round-title">Ronda de <span>Intercambio</span>: ${getTradeRoundLabel(state.tradeRound)}</h2>
      <div class="round-sub">Elegí primero un jugador y luego otro del mismo puesto. El jugador con mayor valor paga la diferencia.</div>
    </div>
    <div class="progress">${positionsInRound.map((_, idx) => `<i class="${idx <= state.tradeRound ? 'done' : ''}"></i>`).join('')}</div>
    ${positionBlocks.join('')}`;

  if (!positionBlocks.length) {
    html = '<div style="text-align:center;color:var(--muted);">No hay jugadores disponibles para intercambio en esta ronda.</div>';
  }

  content.innerHTML = html;
  modal.style.display = 'flex';

  tradeSelection = {};
  positionsInRound.forEach(pos => {
    if (getTradeEntriesForPosition(pos).length) renderTradeGrid(pos);
  });

  document.getElementById('trade-done-btn').onclick = closeTradModal;
}

function renderTradeGrid(posId) {
  const grid = document.querySelector(`.player-grid[data-pos="${posId}"]`);
  if (!grid) return;

  const entries = getTradeEntriesForPosition(posId);
  const selected = tradeSelection[posId];

  grid.innerHTML = entries.map((entry, index) => {
    const color = state.players[entry.playerIdx].color || 'var(--neon)';
    const selectedClass = selected?.index === index ? 'picked' : '';
    const moneyInfo = selected && selected.index !== index ? getTradeMoneyInfo(selected, entry) : null;
    const imagePath = entry.photo && typeof encodeImagePath === 'function'
      ? encodeImagePath(entry.photo)
      : entry.photo;
    const avatarHtml = imagePath
      ? `<img src="${imagePath}" alt="${entry.name}" loading="lazy" onerror="this.remove()" />`
      : initials(entry.name);

    return `
      <div class="p-card ${selectedClass}" data-pos="${posId}" data-index="${index}" data-player-idx="${entry.playerIdx}" data-slot-idx="${entry.slotIdx}">
        <div class="pick-badge">Elegido</div>
        <div class="p-card-inner">
          <div class="p-top">
            <div class="p-avatar" style="border-color:${color};">${avatarHtml}</div>
            <div>
              <div class="p-owner" style="color:${color};">${entry.owner}</div>
              <div class="p-name">${entry.name}</div>
            </div>
          </div>
          <div class="p-club">${entry.club}</div>
          <div class="p-card-footer">
            <div class="p-price">${entry.pricePaid}M</div>
            ${moneyInfo ? `<div class="p-money ${moneyInfo.cls}">${moneyInfo.text}</div>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.p-card').forEach(card => {
    card.addEventListener('click', () => {
      const index = parseInt(card.dataset.index, 10);
      const playerIdx = parseInt(card.dataset.playerIdx, 10);
      const slotIdx = parseInt(card.dataset.slotIdx, 10);
      onTradeCardClick(posId, index, playerIdx, slotIdx);
    });
  });
}

function onTradeCardClick(posId, index, playerIdx, slotIdx) {
  const entries = getTradeEntriesForPosition(posId);
  const current = tradeSelection[posId];
  const selectedEntry = entries[index];

  if (!selectedEntry) return;

  if (!current) {
    tradeSelection[posId] = {
      index,
      playerIdx,
      slotIdx,
      pricePaid: selectedEntry.pricePaid,
    };
    renderTradeGrid(posId);
    return;
  }

  if (current.index === index) {
    tradeSelection[posId] = null;
    renderTradeGrid(posId);
    return;
  }

  performSwap(posId, current, { index, playerIdx, slotIdx });
}

function performSwap(posId, source, target) {
  const grid = document.querySelector(`.player-grid[data-pos="${posId}"]`);
  if (!grid) return;
  const cards = grid.querySelectorAll('.p-card');
  cards[source.index]?.classList.add('swapping');
  cards[target.index]?.classList.add('swapping');

  const playerA = state.players[source.playerIdx];
  const playerB = state.players[target.playerIdx];
  const cardA = playerA.team[posId][source.slotIdx];
  const cardB = playerB.team[posId][target.slotIdx];
  const nameA = cardA.name;
  const nameB = cardB.name;

  setTimeout(() => {
    if (source.playerIdx !== target.playerIdx) {
      const priceDiff = cardB.pricePaid - cardA.pricePaid;
      if (priceDiff > 0) {
        if (playerA.balance < priceDiff) {
          showNotif('No tienes suficiente presupuesto para este intercambio');
          renderTradeGrid(posId);
          return;
        }
        playerA.balance -= priceDiff;
        playerB.balance += priceDiff;
      } else if (priceDiff < 0) {
        const amount = Math.abs(priceDiff);
        if (playerB.balance < amount) {
          showNotif('El otro jugador no tiene suficiente presupuesto');
          renderTradeGrid(posId);
          return;
        }
        playerB.balance -= amount;
        playerA.balance += amount;
      }
    }

    [playerA.team[posId][source.slotIdx], playerB.team[posId][target.slotIdx]] =
      [playerB.team[posId][target.slotIdx], playerA.team[posId][source.slotIdx]];

    state.tradeLog.push({
      type: 'trade',
      playerA: playerA.name,
      playerB: playerB.name,
      playerSwapped: nameA,
      playerReceived: nameB,
      pos: posId,
    });

    tradeSelection[posId] = null;
    renderTradeGrid(posId);
    renderBalances();
    showNotif(`Intercambio realizado: ${nameA} ↔ ${nameB}`);
  }, 170);
}

function closeTradModal() {
  document.getElementById('trade-modal').style.display = 'none';
  state.tradeMode   = false;
  state.tradeRound++;

  state.currentPosIdx++;
  state.currentPlayerIdx = 0;

  if (state.currentPosIdx >= state.positionOrder.length) { endAuction(); return; }

  state.timerPaused = false;
  loadNextPlayer();
}


