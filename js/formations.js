// ══════════════════════════════════════════
// FORMATIONS.JS
// ══════════════════════════════════════════

function renderFormations() {
  const grid = document.getElementById('formations-grid');
  grid.innerHTML = '';

  state.players.forEach((p, pi) => {
    const card = document.createElement('div');
    card.className = 'formation-card';
    card.innerHTML = `
      <div class="formation-header">
        <div class="p-dot" style="background:${p.color}"></div>
        <div class="p-name-h">${p.name}</div>
        <div class="p-budget">💰 ${p.balance}M restantes</div>
      </div>
      <div class="pitch-visual" id="pitch-${pi}">
        <div class="pitch-center-line"></div>
      </div>`;
    grid.appendChild(card);

    const pitch = document.getElementById(`pitch-${pi}`);
    buildPitchSlots(pitch, p, p.color);
  });
}

function buildPitchSlots(pitchEl, playerData, color) {
  POSITIONS_433.forEach(posInfo => {
    const teamSlots = playerData.team[posInfo.key] || [];
    posInfo.pitchXs.forEach((xPct, slotIdx) => {
      const filled = teamSlots[slotIdx];
      const slot = document.createElement('div');
      slot.className = 'pos-slot';
      slot.style.left = `${xPct}%`;
      slot.style.top = `${posInfo.pitchY}%`;

      if (filled) {
        slot.innerHTML = `
          <div class="slot-circle filled" style="--player-color:${color}">
            ${filled.photo
              ? `<img src="${filled.photo}" alt="${filled.name}" onerror="this.parentElement.textContent='⚽'">`
              : '⚽'}
          </div>
          <div class="slot-name filled-name" title="${filled.name}">${filled.name.split(' ').pop()}</div>
          <div class="slot-price">${filled.pricePaid}M</div>`;
      } else {
        slot.innerHTML = `
          <div class="slot-circle">
            <span style="font-size:0.7rem">${posInfo.key}</span>
          </div>
          <div class="slot-name">Libre</div>`;
      }
      pitchEl.appendChild(slot);
    });
  });
}