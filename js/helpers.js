// ── Precio base aleatorio ──
function basePrice() {
  const commonRange = [];
  for (let v = 5; v <= 60; v += 5) commonRange.push(v);
  const rareRange = [];
  for (let v = 65; v <= 80; v += 5) rareRange.push(v);
  const pool = Math.random() < 0.8 ? commonRange : rareRange;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Fallback de Imagenes/jugadores para una posición ──
function getDemoPlayersForPosition(positionType) {
  const demoPlayers = typeof DEMO_PLAYERS !== 'undefined' ? DEMO_PLAYERS : {};
  if (Array.isArray(demoPlayers[positionType]) && demoPlayers[positionType].length) {
    return demoPlayers[positionType];
  }
  const nonGkPlayers = Object.keys(demoPlayers)
    .filter(key => key !== 'Arquero' && Array.isArray(demoPlayers[key]))
    .reduce((acc, key) => acc.concat(demoPlayers[key]), []);
  if (nonGkPlayers.length) return nonGkPlayers;
  return Object.values(demoPlayers).reduce((acc, arr) => Array.isArray(arr) ? acc.concat(arr) : acc, []);
}

// ── Fisher-Yates ──
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Fetch desde API real ──
async function fetchPlayersFromAPI(positionType, leagueId, season, apiKey, needed) {
  const posMap = {
    Arquero: 'Goalkeeper',
    LateralDerecho: 'Defender', CentralDerecho: 'Defender', CentralIzquierdo: 'Defender', LateralIzquierdo: 'Defender',
    MediocampistaIzquierdo: 'Midfielder', MediocampistaC: 'Midfielder', MediocampistaD: 'Midfielder',
    ExtremoDerecho: 'Attacker', ExtremoIzquierdo: 'Attacker', DelanteroC: 'Attacker',
  };
  const pos = posMap[positionType];
  const leagues = leagueId === 'all' ? [39, 140, 135, 78, 61] : [parseInt(leagueId)];
  let allPlayers = [];

  for (const lg of leagues) {
    if (allPlayers.length >= needed * 2) break;
    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/players?league=${lg}&season=${season}&position=${pos}&page=1`,
        { headers: { 'x-apisports-key': apiKey } }
      );
      const data = await res.json();
      if (data.errors && Object.keys(data.errors).length > 0) throw new Error(JSON.stringify(data.errors));
      const mapped = (data.response || []).map(p => ({
        id: p.player.id,
        name: p.player.name,
        club: p.statistics[0]?.team?.name || '',
        nat: p.player.nationality || '',
        rat: Math.round(parseFloat(p.statistics[0]?.games?.rating) * 10) || (positionType === 'Arquero' ? 80 : 78),
        photo: p.player.photo || '',
      })).filter(p => p.rat > 0);
      allPlayers = allPlayers.concat(mapped);
    } catch (e) {
      console.warn('API error for league', lg, e);
    }
  }

  allPlayers.sort((a, b) => b.rat - a.rat);
  const top = allPlayers.slice(0, Math.min(allPlayers.length, needed * 3));
  return shuffleArray(top).slice(0, needed);
}