function showNotif(msg, duration = 2500) {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

function renderBalances() {
  const list = document.getElementById('balance-list');
  list.innerHTML = state.players.map(p => `
    <div class="balance-item">
      <div class="bidder-dot" style="background:${p.color};width:10px;height:10px;border-radius:50%;flex-shrink:0;"></div>
      <div class="b-name">${p.name}</div>
      <div class="balance-bar-wrap"><div class="balance-bar" style="width:${p.balance / BUDGET * 100}%"></div></div>
      <div class="b-val">${p.balance}M</div>
    </div>`).join('');
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

function renderPoolRemaining() {
  const display = document.getElementById('pool-remaining-display');
  display.innerHTML = state.positionOrder.map((pos, i) => {
    const pool = state.pool[pos] || [];
    const remaining = pool.length - (
      state.currentPosIdx === i ? state.currentPlayerIdx :
      state.currentPosIdx > i  ? pool.length : 0
    );
    const isCurr = state.currentPosIdx === i;
    return `<div class="pool-pos-row${isCurr ? ' current-pos' : ''}">
      <span class="pos-label">${getPosLabel(pos)}</span>
      <span class="pos-count">${Math.max(0, remaining)} restantes</span>
    </div>`;
  }).join('');
}

function addLog(entry) {
  state.auctionLog.unshift(entry);
  renderLog();
}