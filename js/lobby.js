// ══════════════════════════════════════════
// LOBBY.JS — Setup de jugadores y arranque
// ══════════════════════════════════════════

function updatePlayerCountDisplay() {
  const valueEl = document.getElementById('num-players-value');
  const minusBtn = document.getElementById('count-minus');
  const plusBtn = document.getElementById('count-plus');
  if (valueEl) valueEl.textContent = state.numPlayers;
  if (minusBtn) minusBtn.disabled = state.numPlayers <= 2;
  if (plusBtn) plusBtn.disabled = state.numPlayers >= 5;
}

function renderPlayerSetup() {
  const n = state.numPlayers;
  state.numPlayers = n;
  const grid = document.getElementById('players-setup');
  grid.innerHTML = '';

  for (let i = 0; i < n; i++) {
    const card = document.createElement('div');
    card.className = 'player-card-setup';
    card.innerHTML = `
      <div class="num">${i + 1}</div>
      <div class="field-group">
        <label>Nombre</label>
        <input type="text" id="p-name-${i}" placeholder="Jugador ${i + 1}" value="Jugador ${i + 1}" />
      </div>
      <div class="color-row">
        <label>Icono:</label>
        ${PLAYER_ICONS.map((iconPath, ci) => `
          <div class="color-swatch ${ci === i ? 'selected' : ''}"
               data-player="${i}" data-icon="${ci}"
               title="${COLOR_NAMES[ci]}">
            <img src="${iconPath}" alt="${COLOR_NAMES[ci]}" />
          </div>
        `).join('')}
      </div>`;
    grid.appendChild(card);
  }

  grid.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      const pi = sw.dataset.player;
      grid.querySelectorAll(`.color-swatch[data-player="${pi}"]`).forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
    });
  });

  updatePlayerCountDisplay();
  updateStartBtn();
}

function updateStartBtn() {
  document.getElementById('start-btn').disabled = false;
}

async function startGame() {
  const n = state.numPlayers;
  const needed = n + 2; // pool size per position

  const leagueSelect  = document.getElementById('league-select');
  const seasonSelect  = document.getElementById('season-select');
  const apiKeyInput   = document.getElementById('api-key-input');
  const leagueId      = leagueSelect ? leagueSelect.value : 'all';
  const season        = seasonSelect ? seasonSelect.value : '2024';
  const apiKey        = apiKeyInput  ? apiKeyInput.value.trim() : '';
  const useDemoMode   = !apiKey || state.demoMode;

  // Construir jugadores
  const setupGrid = document.getElementById('players-setup');
  state.players = [];
  for (let i = 0; i < n; i++) {
    const name     = document.getElementById(`p-name-${i}`).value.trim() || `Jugador ${i + 1}`;
    const selSwatch = setupGrid.querySelector(`.color-swatch[data-player="${i}"].selected`);
    const colorIdx  = selSwatch ? parseInt(selSwatch.dataset.icon) : i;
    state.players.push({
      name,
      color: PLAYER_COLORS[colorIdx],
      icon: PLAYER_ICONS[colorIdx],
      balance: BUDGET,
      team: { Arquero: [], LateralDerecho: [], CentralDerecho: [], CentralIzquierdo: [], LateralIzquierdo: [], MediocampistaIzquierdo: [], MediocampistaC: [], MediocampistaD: [], ExtremoDerecho: [], ExtremoIzquierdo: [], DelanteroC: [] }
    });
  }
  state.positionSkips = { Arquero: 0, LateralDerecho: 0, CentralDerecho: 0, CentralIzquierdo: 0, LateralIzquierdo: 0, MediocampistaIzquierdo: 0, MediocampistaC: 0, MediocampistaD: 0, ExtremoDerecho: 0, ExtremoIzquierdo: 0, DelanteroC: 0 };

  const loadMsg  = document.getElementById('loading-msg');
  const startBtn = document.getElementById('start-btn');
  startBtn.disabled = true;
  loadMsg.style.display = 'block';

  if (useDemoMode) {
    loadMsg.textContent = 'Cargando jugadores de demo...';
    state.pool = {};
    for (const pos of state.positionOrder) {
      const all = shuffleArray([...getDemoPlayersForPosition(pos)]);
      state.pool[pos] = all.slice(0, needed).map(p => ({ ...p, basePrice: basePrice() }));
    }
    loadMsg.textContent = '✓ ¡Listo!';
    setTimeout(() => { loadMsg.style.display = 'none'; launchAuction(); }, 400);
  } else {
    state.apiKey = apiKey;
    state.pool   = {};
    let failed   = false;

    for (const pos of state.positionOrder) {
      loadMsg.textContent = `Cargando ${getPosLabel(pos)}...`;
      try {
        const players = await fetchPlayersFromAPI(pos, leagueId, season, apiKey, needed);
        if (players.length === 0) throw new Error('No players returned');
        state.pool[pos] = players.map(p => ({ ...p, basePrice: basePrice() }));
      } catch (e) {
        console.error(e);
        failed = true;
        showNotif('Error con la API — usando datos de demo', 3000);
        const all = shuffleArray([...getDemoPlayersForPosition(pos)]);
        state.pool[pos] = all.slice(0, needed).map(p => ({ ...p, basePrice: basePrice() }));
      }
    }

    loadMsg.textContent = failed ? '⚠ Usando demo por error de API' : '✓ Jugadores cargados';
    setTimeout(() => { loadMsg.style.display = 'none'; launchAuction(); }, 600);
  }
}

// ── Event listeners de lobby ──
document.getElementById('count-minus').addEventListener('click', () => {
  if (state.numPlayers > 2) {
    state.numPlayers -= 1;
    renderPlayerSetup();
  }
});

document.getElementById('count-plus').addEventListener('click', () => {
  if (state.numPlayers < 5) {
    state.numPlayers += 1;
    renderPlayerSetup();
  }
});

document.getElementById('start-btn').addEventListener('click', startGame);