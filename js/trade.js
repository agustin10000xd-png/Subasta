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

// Abre el modal de trade y construye su contenido
function openTradeModal() {
  const modal   = document.getElementById('trade-modal');
  const title   = document.getElementById('trade-round-title');
  const content = document.getElementById('trade-content');

  state.tradeMode   = true;
  state.timerPaused = true;
  clearInterval(state.timerInterval);

  title.textContent = 'Ronda de Intercambio: ' + getTradeRoundLabel(state.tradeRound);

  const positionsInRound = getPositionsForTradeRound(state.tradeRound);
  let html = '';

  positionsInRound.forEach(pos => {
    const posLabel      = getPosLabel(pos);
    const playersByPos  = state.players
      .map((player, idx) => ({ playerIdx: idx, playerName: player.name, players: player.team[pos] || [] }))
      .filter(p => p.players.length > 0);

    if (playersByPos.length === 0) return;

    html += `<div style="border:1px solid rgba(255,255,255,0.16);padding:18px;border-radius:14px;background:rgba(255,255,255,0.03);">
      <h4 style="margin:0 0 12px 0;color:var(--green);font-size:1rem;">${posLabel}</h4>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">`;

    playersByPos.forEach(pData => {
      pData.players.forEach((player, idx) => {
        html += `
          <div style="background:rgba(255,255,255,0.06);padding:14px;border-radius:12px;text-align:left;border:1px solid rgba(255,255,255,0.08);">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <div style="font-weight:700;font-size:1rem;">${player.name}</div>
              <div style="padding:4px 8px;border-radius:999px;background:rgba(0,200,83,0.14);color:var(--green);font-size:0.8rem;font-weight:600;white-space:nowrap;">${state.players[pData.playerIdx].name}</div>
            </div>
            <div style="font-size:0.9rem;color:var(--muted);margin-bottom:8px;">${player.club}</div>
            <div style="color:var(--green);font-family:var(--font-display);font-weight:600;font-size:1.05rem;margin-bottom:10px;">${player.pricePaid}M</div>
            <button onclick="openTradeDialog('${pos}', ${pData.playerIdx}, ${idx})" class="btn-sm" style="width:100%;padding:10px 12px;">Intercambiar</button>
          </div>`;
      });
    });

    html += '</div></div>';
  });

  if (!html) {
    html = '<div style="text-align:center;color:var(--muted);">No hay jugadores disponibles para intercambio en esta ronda.</div>';
  }

  content.innerHTML = html;
  modal.style.display = 'flex';

  // Vincula el botón "Listo" al cierre correcto
  document.getElementById('trade-done-btn').onclick = closeTradModal;
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

// Diálogo para elegir con quién intercambiar
function openTradeDialog(position, playerAIdx, playerIdx) {
  const playerA        = state.players[playerAIdx];
  const selectedPlayer = playerA.team[position][playerIdx];

  const otherPlayers = state.players
    .map((p, idx) => ({ player: p, idx, hasPos: p.team[position]?.length > 0 }))
    .filter(p => p.idx !== playerAIdx && p.hasPos);

  if (otherPlayers.length === 0) {
    showNotif('No hay otros jugadores con esta posición para intercambiar');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'trade-dialog';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:1001;display:flex;align-items:center;justify-content:center;';

  const box = document.createElement('div');
  box.style.cssText = 'background:var(--pitch-mid);border:1px solid rgba(255,255,255,0.14);border-radius:16px;padding:26px;max-width:760px;width:92%;box-shadow:0 20px 50px rgba(0,0,0,0.35);';

  const titleEl = document.createElement('h3');
  titleEl.style.marginTop = '0';
  titleEl.textContent = 'Intercambiar ' + selectedPlayer.name;
  box.appendChild(titleEl);

  const subtitle = document.createElement('p');
  subtitle.style.color = 'var(--muted)';
  subtitle.textContent = 'Selecciona con quién deseas intercambiar:';
  box.appendChild(subtitle);

  const optionsContainer = document.createElement('div');
  optionsContainer.style.cssText = 'display:grid;gap:12px;margin-bottom:20px;max-height:360px;overflow-y:auto;';
  box.appendChild(optionsContainer);

  otherPlayers.forEach(op => {
    op.player.team[position].forEach((otherPlayer, otherIdx) => {
      const priceDiff = otherPlayer.pricePaid - selectedPlayer.pricePaid;
      const summary   = priceDiff > 0
        ? `+ ${priceDiff}M a ${playerA.name}`
        : priceDiff < 0
          ? `+ ${Math.abs(priceDiff)}M a ${op.player.name}`
          : 'Intercambio justo';

      const btn = document.createElement('button');
      btn.onclick = () => executeTrade(position, playerAIdx, playerIdx, op.idx, otherIdx);
      btn.style.cssText = 'padding:14px;text-align:left;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;cursor:pointer;color:var(--white);';
      btn.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;">
          <div style="font-weight:700;font-size:1rem;">${otherPlayer.name}</div>
          <div style="padding:4px 8px;border-radius:999px;background:rgba(0,200,83,0.14);color:var(--green);font-size:0.8rem;font-weight:600;">${op.player.name}</div>
        </div>
        <div style="font-size:0.9rem;color:var(--muted);">${otherPlayer.club} - ${otherPlayer.pricePaid}M</div>
        <div style="font-size:0.9rem;color:var(--green);margin-top:6px;">${summary}</div>`;
      optionsContainer.appendChild(btn);
    });
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-sm';
  cancelBtn.style.cssText = 'width:100%;margin-top:12px;';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.onclick = () => modal.remove();
  box.appendChild(cancelBtn);

  modal.appendChild(box);
  document.body.appendChild(modal);
}

function executeTrade(position, playerAIdx, playerASlotIdx, playerBIdx, playerBSlotIdx) {
  const playerA    = state.players[playerAIdx];
  const playerB    = state.players[playerBIdx];
  const playerACard = playerA.team[position][playerASlotIdx];
  const playerBCard = playerB.team[position][playerBSlotIdx];
  const priceDiff   = playerBCard.pricePaid - playerACard.pricePaid;

  if (priceDiff > 0) {
    if (playerA.balance < priceDiff) { showNotif('No tienes suficiente presupuesto para este intercambio'); return; }
    playerA.balance -= priceDiff;
    playerB.balance += priceDiff;
  } else if (priceDiff < 0) {
    if (playerB.balance < Math.abs(priceDiff)) { showNotif('El otro jugador no tiene suficiente presupuesto'); return; }
    playerB.balance -= Math.abs(priceDiff);
    playerA.balance += Math.abs(priceDiff);
  }

  [playerA.team[position][playerASlotIdx], playerB.team[position][playerBSlotIdx]] =
  [playerB.team[position][playerBSlotIdx], playerA.team[position][playerASlotIdx]];

  state.tradeLog.push({
    type: 'trade',
    playerA: playerA.name, playerB: playerB.name,
    playerSwapped: playerACard.name, playerReceived: playerBCard.name,
    priceDiff,
  });

  showNotif('Intercambio completado');
  document.querySelectorAll('.trade-dialog').forEach(d => d.remove());

  // Refresca el modal de trade
  setTimeout(() => openTradeModal(), 300);
}