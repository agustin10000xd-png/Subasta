// ══════════════════════════════════════════
// LOBBY.JS — Setup de jugadores y arranque
// ══════════════════════════════════════════

function renderPlayerSetup() {
  const n = parseInt(document.getElementById('num-players-select').value);
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
        <label>Color:</label>
        ${PLAYER_COLORS.map((c, ci) => `
          <div class="color-swatch ${ci === i ? 'selected' : ''}"
               style="background:${c}"
               data-player="${i}" data-color="${ci}"
               title="${COLOR_NAMES[ci]}"></div>
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
    const colorIdx  = selSwatch ? parseInt(selSwatch.dataset.color) : i;
    state.players.push({
      name,
      color: PLAYER_COLORS[colorIdx],
      balance: BUDGET,
      team: { GK: [], RB: [], RCB: [], LCB: [], LB: [], MedioI: [], MedioC: [], MedioD: [], RW: [], LW: [], ST: [] }
    });
  }
  state.positionSkips = { GK: 0, RB: 0, RCB: 0, LCB: 0, LB: 0, MedioI: 0, MedioC: 0, MedioD: 0, RW: 0, LW: 0, ST: 0 };

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
document.getElementById('num-players-select').addEventListener('change', renderPlayerSetup);
document.getElementById('start-btn').addEventListener('click', startGame);