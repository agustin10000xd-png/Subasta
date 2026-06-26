// ══════════════════════════════════════════
// ENDGAME.JS
// ══════════════════════════════════════════

function endAuction() {
  clearInterval(state.timerInterval);
  state.auctionFinished = true;
  state.votes = {};
  state.votePoints = state.players.map(() => 0);
  state.votingFinished = false;
  state.finishRanking = [];

  buildVoteSection();
  document.getElementById('finish-overlay').classList.add('show');
}

function getPositionCandidates(pos) {
  return state.players.map((player, teamIndex) => {
    const candidate = (player.team[pos] || [])[0] || { name: 'Sin jugador', club: '', pricePaid: 0, photo: '' };
    return {
      teamIndex,
      teamName: player.name,
      teamColor: player.color,
      player,
      candidate,
    };
  });
}

function buildVoteSection() {
  const voteSection = document.getElementById('vote-section');
  const voteActions = document.getElementById('vote-actions');
  const votingResults = document.getElementById('voting-results');
  const rankingList = document.getElementById('ranking-list');
  const finishGrid = document.getElementById('finish-formations-grid');
  const playAgain = document.getElementById('play-again-btn');

  voteSection.innerHTML = '';
  votingResults.style.display = 'none';
  rankingList.style.display = 'none';
  finishGrid.style.display = 'none';
  playAgain.style.display = 'none';
  voteActions.style.display = 'block';

  state.positionOrder.forEach(pos => {
    const posLabel = POSITIONS_433.find(p => p.key === pos).label;
    const card = document.createElement('div');
    card.className = 'vote-card';
    card.innerHTML = `<h3>Votación por puesto: ${posLabel}</h3>`;

    const rows = document.createElement('div');
    rows.className = 'vote-grid';

    const candidates = getPositionCandidates(pos);
    if (!state.votes[pos]) state.votes[pos] = {};

    state.players.forEach((voter, voterIdx) => {
      const row = document.createElement('div');
      row.className = 'vote-row';
      const label = document.createElement('label');
      label.textContent = `Voto de ${voter.name}`;
      const optionsWrap = document.createElement('div');
      optionsWrap.className = 'vote-options';

      if (typeof state.votes[pos][voterIdx] !== 'number') {
        state.votes[pos][voterIdx] = candidates[0]?.teamIndex ?? 0;
      }

      candidates.forEach(c => {
        const optionBtn = document.createElement('button');
        optionBtn.type = 'button';
        optionBtn.className = 'vote-option-btn';
        optionBtn.dataset.teamIndex = c.teamIndex;
        if (state.votes[pos][voterIdx] === c.teamIndex) optionBtn.classList.add('selected');

        const photoMarkup = c.candidate.photo
          ? `<img src="${c.candidate.photo}" alt="${c.candidate.name}" onerror="this.parentElement.innerHTML='<div class=\'vote-option-placeholder\'>⚽</div>'">`
          : `<div class="vote-option-placeholder">⚽</div>`;

        optionBtn.innerHTML = `
          <div class="vote-option-photo">${photoMarkup}</div>
          <div class="vote-option-meta">
            <div class="vote-option-team">${c.teamName}</div>
            <div class="vote-option-player">${c.candidate.name}</div>
          </div>`;

        optionBtn.addEventListener('click', () => {
          state.votes[pos][voterIdx] = c.teamIndex;
          optionsWrap.querySelectorAll('.vote-option-btn').forEach(btn => {
            btn.classList.toggle('selected', parseInt(btn.dataset.teamIndex, 10) === c.teamIndex);
          });
        });

        optionsWrap.appendChild(optionBtn);
      });

      row.appendChild(label);
      row.appendChild(optionsWrap);
      rows.appendChild(row);
    });

    card.appendChild(rows);
    voteSection.appendChild(card);
  });

  document.getElementById('vote-submit-btn').onclick = () => {
    collectVotes();
    evaluateVotes();
  };
}

function collectVotes() {
  state.positionOrder.forEach(pos => {
    if (!state.votes[pos]) state.votes[pos] = {};
    state.players.forEach((_, voterIdx) => {
      const chosen = state.votes[pos][voterIdx];
      state.votes[pos][voterIdx] = isNaN(chosen) ? 0 : chosen;
    });
  });
}

function evaluateVotes() {
  state.votePoints = state.players.map(() => 0);

  state.positionOrder.forEach(pos => {
    const counts = {};
    Object.values(state.votes[pos]).forEach(teamIndex => {
      counts[teamIndex] = (counts[teamIndex] || 0) + 1;
    });

    const maxVotes = Math.max(...Object.values(counts));
    const winners = Object.entries(counts)
      .filter(([, count]) => count === maxVotes)
      .map(([teamIndex]) => parseInt(teamIndex, 10));

    winners.forEach(teamIndex => {
      state.votePoints[teamIndex] += 1;
    });
  });

  renderVotingResults();
}

function renderVotingResults() {
  const voteSection = document.getElementById('vote-section');
  const voteActions = document.getElementById('vote-actions');
  const votingResults = document.getElementById('voting-results');
  const votingSummary = document.getElementById('voting-summary');
  const rankingList = document.getElementById('ranking-list');
  const finishGrid = document.getElementById('finish-formations-grid');
  const playAgain = document.getElementById('play-again-btn');

  voteSection.style.display = 'none';
  voteActions.style.display = 'none';
  votingResults.style.display = 'block';
  votingSummary.innerHTML = `
    <div class="voting-result-card">
      <strong>Resultados de la votación</strong>
      <div class="vote-note">Se ordenó el podio según los puntos obtenidos por cada equipo.</div>
    </div>`;

  state.votingFinished = true;
  renderFinishRanking();
  renderFinishFormations();

  rankingList.style.display = 'block';
  finishGrid.style.display = 'grid';
  playAgain.style.display = 'block';

  playAgain.onclick = () => window.location.reload();
}

function getPlayersByVoteOrder() {
  if (!state.votingFinished) return state.players;
  return state.players
    .map((p, idx) => ({
      team: p,
      votePoints: state.votePoints[idx],
      totalSpent: BUDGET - p.balance,
      originalIndex: idx,
    }))
    .sort((a, b) => b.votePoints - a.votePoints || a.totalSpent - b.totalSpent || a.originalIndex - b.originalIndex);
}

function renderFinishRanking() {
  const rankingList = document.getElementById('ranking-list');
  const ordered = getPlayersByVoteOrder();

  rankingList.innerHTML = ordered
    .map((entry, i) => `
      <div class="ranking-item ${i === 0 ? 'rank-1' : ''}">
        <div class="rank-num ${i === 0 ? 'gold' : ''}">${i === 0 ? '🏆' : i + 1}</div>
        <div class="rank-dot" style="background:${entry.team.color}"></div>
        <div class="rank-info">
          <div class="rank-name">${entry.team.name}</div>
          <div class="rank-detail">${entry.votePoints} punto${entry.votePoints !== 1 ? 's' : ''} de votación</div>
        </div>
        <div class="rank-spent">${entry.votePoints} pts</div>
      </div>`)
    .join('');
}

function renderFinishFormations() {
  const grid = document.getElementById('finish-formations-grid');
  grid.innerHTML = '';

  const ordered = getPlayersByVoteOrder();

  ordered.forEach((entry, index) => {
    const p = entry.team;
    const pi = entry.originalIndex;
    const totalPlayers = Object.values(p.team).flat().length;
    const card = document.createElement('div');
    card.className = 'formation-card' + (index === 0 ? ' chosen-winner' : '');
    card.innerHTML = `
      <div class="formation-header">
        <div class="p-dot" style="background:${p.color}"></div>
        <div class="p-name-h">${p.name}${index === 0 ? ' 👑' : ''}</div>
        <div class="p-budget">💰 ${p.balance}M restantes · ${totalPlayers} jug.</div>
      </div>
      <div class="pitch-visual" id="finish-pitch-${pi}">
        <div class="pitch-center-line"></div>
      </div>`;
    grid.appendChild(card);

    const pitch = card.querySelector(`#finish-pitch-${pi}`);
    buildPitchSlots(pitch, p, p.color);
  });

}
