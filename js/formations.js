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
        <div class="formation-player-icon">
          ${p.icon
            ? `<img src="${p.icon}" alt="${p.name}" />`
            : `<div class="p-dot" style="background:${p.color}"></div>`}
        </div>
        <div class="p-name-h">${p.name}</div>
        <div class="p-budget">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-moneybag">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M9.5 3h5a1.5 1.5 0 0 1 1.5 1.5a3.5 3.5 0 0 1 -3.5 3.5h-1a3.5 3.5 0 0 1 -3.5 -3.5a1.5 1.5 0 0 1 1.5 -1.5" />
            <path d="M4 17v-1a8 8 0 1 1 16 0v1a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4" />
          </svg>
          ${p.balance}M restantes
        </div>
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
        const labelFormatted = posInfo.label
          .replace(/Centro/, '<br>Centro')
          .replace(/Derecho/, '<br>Derecho')
          .replace(/Izquierdo/, '<br>Izquierdo');
          slot.innerHTML = `
            <div class="slot-circle">
              <span style="font-size:0.7rem">${labelFormatted}</span>
            </div>`;
      }
      pitchEl.appendChild(slot);
    });
  });
}