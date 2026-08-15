// ══════════════════════════════════════════
// LOBBY.JS — Setup de jugadores y arranque
// ══════════════════════════════════════════
console.log('lobby.js cargado');
let lobbyEventsInitialized = false;

function updatePlayerCountDisplay() {
  const valueEl = document.getElementById('num-players-value');
  const minusBtn = document.getElementById('count-minus');
  const plusBtn = document.getElementById('count-plus');
  if (valueEl) valueEl.textContent = state.numPlayers;
  if (minusBtn) minusBtn.disabled = state.numPlayers <= 2;
  if (plusBtn) plusBtn.disabled = state.numPlayers >= 5;
}

function updateBudgetDisplay() {
  const valueEl = document.getElementById('budget-value');
  const minusBtn = document.getElementById('budget-minus');
  const plusBtn = document.getElementById('budget-plus');
  if (valueEl) valueEl.textContent = `${BUDGET}M`;
  if (minusBtn) minusBtn.disabled = BUDGET <= BUDGET_MIN;
  if (plusBtn) plusBtn.disabled = BUDGET >= BUDGET_MAX;
}

function renderPlayerSetup() {
  const n = state.numPlayers;
  state.numPlayers = n;
  const grid = document.getElementById('players-setup');
  if (!grid) {
    console.warn('No se encontró el contenedor players-setup');
    return;
  }

  grid.innerHTML = '';

  for (let i = 0; i < n; i++) {
    const card = document.createElement('div');
    card.className = 'card-frame';
    card.innerHTML = `
      <div class="card">
        <div class="card-num">${i + 1}</div>
        <div class="card-rule"></div>
        <div class="field-label">Nombre</div>
        <input class="field-input" type="text" id="p-name-${i}" placeholder="Jugador ${i + 1}" value="Jugador ${i + 1}" />
        <div class="field-label">Icono</div>
        <div class="icons">
          ${PLAYER_ICONS.map((iconPath, ci) => `
            <div class="icon-ball ${ci === i ? 'sel' : ''}"
                 data-player="${i}" data-icon="${ci}"
                 title="${COLOR_NAMES[ci]}">
              <img src="${iconPath}" alt="${COLOR_NAMES[ci]}" />
            </div>
          `).join('')}
        </div>
      </div>`;
    grid.appendChild(card);
  }

  grid.querySelectorAll('.icon-ball').forEach(sw => {
    sw.addEventListener('click', () => {
      const pi = sw.dataset.player;
      grid.querySelectorAll(`.icon-ball[data-player="${pi}"]`).forEach(s => s.classList.remove('sel'));
      sw.classList.add('sel');
    });
  });

  updatePlayerCountDisplay();
  updateStartBtn();
}

function updateStartBtn() {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.disabled = false;
  } else {
    console.error('updateStartBtn: start button no encontrado');
  }
}
function initLobbyEvents() {
  if (lobbyEventsInitialized) return;
  lobbyEventsInitialized = true;
  console.log('initLobbyEvents running - document.readyState=', document.readyState);

  const minusBtn = document.getElementById('count-minus');
  const plusBtn = document.getElementById('count-plus');
  const startBtn = document.getElementById('start-btn');

  if (minusBtn) {
    minusBtn.addEventListener('click', () => {
      if (state.numPlayers > 2) {
        state.numPlayers -= 1;
        renderPlayerSetup();
      }
    });
  } else {
    console.error('lobby init: count-minus no encontrado');
  }

  if (plusBtn) {
    plusBtn.addEventListener('click', () => {
      if (state.numPlayers < 5) {
        state.numPlayers += 1;
        renderPlayerSetup();
      }
    });
  } else {
    console.error('lobby init: count-plus no encontrado');
  }

  if (startBtn) {
    console.log('lobby init: start button found');
    startBtn.addEventListener('click', startGame);
  } else {
    console.error('lobby init: start button no encontrado');
  }

  const budgetMinusBtn = document.getElementById('budget-minus');
  const budgetPlusBtn  = document.getElementById('budget-plus');

  if (budgetMinusBtn) {
    budgetMinusBtn.addEventListener('click', () => {
      if (BUDGET > BUDGET_MIN) {
        BUDGET -= BUDGET_STEP;
        updateBudgetDisplay();
      }
    });
  } else {
    console.error('lobby init: budget-minus no encontrado');
  }

  if (budgetPlusBtn) {
    budgetPlusBtn.addEventListener('click', () => {
      if (BUDGET < BUDGET_MAX) {
        BUDGET += BUDGET_STEP;
        updateBudgetDisplay();
      }
    });
  } else {
    console.error('lobby init: budget-plus no encontrado');
  }

  updateBudgetDisplay();

  renderPlayerSetup();
}

window.addEventListener('DOMContentLoaded', initLobbyEvents);
window.addEventListener('load', initLobbyEvents);


async function startGame() {
  try {
    console.log('startGame called', { numPlayers: state.numPlayers, demoMode: state.demoMode });
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
    const loadMsg = document.getElementById('loading-msg');
    const startBtn = document.getElementById('start-btn');
    if (!setupGrid || !startBtn || !loadMsg) {
      if (typeof showNotif === 'function') {
        showNotif('Error interno al iniciar la partida', 3000);
      }
      return;
    }

  state.players = [];
  for (let i = 0; i < n; i++) {
    const name = document.getElementById(`p-name-${i}`)?.value.trim() || `Jugador ${i + 1}`;
    const selSwatch = setupGrid.querySelector(`.icon-ball[data-player="${i}"].sel`);
    const colorIdx = selSwatch ? parseInt(selSwatch.dataset.icon, 10) : i;
    state.players.push({
      name,
      color: PLAYER_COLORS[colorIdx] || PLAYER_COLORS[0],
      icon: PLAYER_ICONS[colorIdx] || PLAYER_ICONS[0],
      balance: BUDGET,
      team: { Arquero: [], LateralDerecho: [], CentralDerecho: [], CentralIzquierdo: [], LateralIzquierdo: [], MediocampistaIzquierdo: [], MediocampistaC: [], MediocampistaD: [], ExtremoDerecho: [], ExtremoIzquierdo: [], DelanteroC: [] }
    });
  }
  state.positionSkips = { Arquero: 0, LateralDerecho: 0, CentralDerecho: 0, CentralIzquierdo: 0, LateralIzquierdo: 0, MediocampistaIzquierdo: 0, MediocampistaC: 0, MediocampistaD: 0, ExtremoDerecho: 0, ExtremoIzquierdo: 0, DelanteroC: 0 };

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
  } catch (err) {
    console.error('startGame unexpected error', err);
    if (typeof showNotif === 'function') showNotif('Error al iniciar la partida', 4000);
  }
}

