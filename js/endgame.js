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
  state.currentVotePositionIdx = 0;

  buildVoteSection();
  switchTab('formations');
}

function startVoting() {
  document.getElementById('finish-overlay').classList.add('show');
  switchTab('endgame');
}

function getPositionCandidates(pos) {
  return state.players
    .map((player, teamIndex) => {
      const candidate = (player.team[pos] || [])[0];
      if (!candidate || !candidate.name || candidate.name === 'Sin jugador') return null;
      return {
        teamIndex,
        teamName: player.name,
        teamColor: player.color,
        player,
        candidate,
      };
    })
    .filter(Boolean);
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
  voteActions.style.display = 'none';

  renderCurrentVotePosition();
}

function renderCurrentVotePosition() {
  const voteSection = document.getElementById('vote-section');
  const voteActions = document.getElementById('vote-actions');
  const pos = state.positionOrder[state.currentVotePositionIdx];
  const posLabel = POSITIONS_433.find(p => p.key === pos).label;
  
  voteSection.innerHTML = '';
  const headerDiv = document.createElement('div');
  headerDiv.className = 'wrap';
  headerDiv.innerHTML = `
    <div class="head">
      <div class="trophy">🏆</div>
      <h1>¡Subasta terminada!</h1>
      <p>Así quedaron los equipos finales — elegí cuál te pareció el mejor armado</p>
    </div>
    <div class="pos-progress">
      <div class="pos-progress-bar"><div class="pos-progress-fill" style="width:${Math.round(((state.currentVotePositionIdx + 1) / state.positionOrder.length) * 100)}%"></div></div>
      <div class="pos-progress-label"><span>Posición <b>${state.currentVotePositionIdx + 1}</b> de ${state.positionOrder.length}</span><span>${state.positionOrder.length - state.currentVotePositionIdx - 1} restantes</span></div>
    </div>
    <div class="position-title"><span>${posLabel}</span></div>
    <div class="position-hint">Cada jugador toca <b>su propio ícono</b> sobre el jugador que le pareció mejor</div>
  `;
  voteSection.appendChild(headerDiv);

  const legendEl = document.createElement('div');
  legendEl.className = 'legend';
  legendEl.innerHTML = state.players.map(player => `
    <div class="legend-item"><span class="legend-dot" style="background:${player.color}"></span>${player.name}</div>
  `).join('');
  voteSection.appendChild(legendEl);

  const candidatesEl = document.createElement('div');
  candidatesEl.className = 'candidates';

  const candidates = getPositionCandidates(pos);
  if (!state.votes[pos]) state.votes[pos] = {};

  const counts = candidates.map(candidate =>
    state.players.filter((_, voterIdx) => state.votes[pos][voterIdx] === candidate.teamIndex).length
  );
  const totalVotes = counts.reduce((sum, value) => sum + value, 0);

  candidates.forEach((candidate, index) => {
    const owner = state.players[candidate.teamIndex];
    const count = counts[index] || 0;
    const maxCount = totalVotes ? Math.max(...counts) : 0;
    const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
    const isLeader = totalVotes > 0 && count === maxCount && count > 0;

    const card = document.createElement('div');
    card.className = `c-card${isLeader ? ' leader' : ''}`;
    card.innerHTML = `
      <div class="crown">👑</div>
      <div class="c-card-inner">
        <div class="c-owner-tag" style="color:${owner.color}">Elegido por ${owner.name}</div>
        <div class="c-top">
          <div class="c-photo">${candidate.candidate.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
          <div>
            <div class="c-name">${candidate.candidate.name}</div>
            <div class="c-club">${candidate.candidate.club}</div>
          </div>
        </div>
        <div class="c-bar"><div class="c-bar-fill" style="width:${pct}%"></div></div>
        <div class="c-vote-row">
          <div class="c-vote-label">${count} voto${count === 1 ? '' : 's'}</div>
          <div class="voter-chips">
            ${state.players.map((voter, voterIdx) => {
              const active = state.votes[pos] && state.votes[pos][voterIdx] === candidate.teamIndex;
              const imgPath = voter.photo && typeof encodeImagePath === 'function' ? encodeImagePath(voter.photo) : (voter.photo || '');
              const style = active ? `background:${voter.color}; border-color:${voter.color}` : '';
              const content = active && imgPath ? `<img src="${imgPath}" alt="${voter.name}">` : `${voter.name.slice(-1)}`;
              const cls = `v-chip ${active ? 'active' : ''}`;
              return `<div class="${cls}" style="${style}" data-voter="${voterIdx}" data-cand="${candidate.teamIndex}" title="${voter.name}">${content}</div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    card.querySelectorAll('.v-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const voterIdx = parseInt(chip.dataset.voter, 10);
        const teamIndex = parseInt(chip.dataset.cand, 10);
        if (state.votes[pos][voterIdx] === teamIndex) {
          delete state.votes[pos][voterIdx];
        } else {
          state.votes[pos][voterIdx] = teamIndex;
        }
        renderCurrentVotePosition();
      });
    });

    candidatesEl.appendChild(card);
  });

  voteSection.appendChild(candidatesEl);

  // Navigation buttons (don't allow skipping until all players voted)
  const navDiv = document.createElement('div');
  navDiv.style.cssText = 'display:flex;gap:12px;justify-content:center;margin-top:24px;';

  const totalPlayers = state.players.length;
  const votedCount = state.players.filter((_, i) => typeof state.votes[pos] !== 'undefined' && typeof state.votes[pos][i] !== 'undefined').length;

  if (state.currentVotePositionIdx > 0) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn-primary';
    prevBtn.textContent = '← Posición anterior';
    prevBtn.style.cssText = 'background:var(--green-dark);';
    prevBtn.onclick = () => {
      state.currentVotePositionIdx--;
      renderCurrentVotePosition();
    };
    navDiv.appendChild(prevBtn);
  }

  if (state.currentVotePositionIdx < state.positionOrder.length - 1) {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn-primary';
    if (votedCount < totalPlayers) {
      nextBtn.textContent = `Esperando votos (${votedCount}/${totalPlayers})`;
      nextBtn.disabled = true;
      nextBtn.style.opacity = '0.6';
      nextBtn.title = 'No puedes avanzar hasta que todos voten';
    } else {
      nextBtn.textContent = 'Siguiente posición →';
      nextBtn.onclick = () => {
        state.currentVotePositionIdx++;
        renderCurrentVotePosition();
      };
    }
    navDiv.appendChild(nextBtn);
  } else {
    // Última posición: mostrar botón de terminar votación
    const finishBtn = document.createElement('button');
    finishBtn.className = 'btn-primary';
    if (votedCount < totalPlayers) {
      finishBtn.textContent = `Esperando votos (${votedCount}/${totalPlayers})`;
      finishBtn.disabled = true;
      finishBtn.style.opacity = '0.6';
      finishBtn.title = 'No puedes terminar hasta que todos voten';
    } else {
      finishBtn.textContent = 'Terminar votación';
      finishBtn.onclick = () => {
        collectVotes();
        evaluateVotes();
      };
    }
    navDiv.appendChild(finishBtn);
  }

  voteSection.appendChild(navDiv);
  
  // Ocultar el botón de "vote-submit-btn" original
  voteActions.style.display = 'none';
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
  document.getElementById('finish-overlay').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <div class="pitch-markings">
          <div class="outer-rect"></div>
          <div class="half-line"></div>
          <div class="center-circle"></div>
          <div class="penalty-box top"></div>
          <div class="penalty-box bottom"></div>
          <div class="goal-box top"></div>
          <div class="goal-box bottom"></div>
        </div>
        <div class="pitch-center-line"></div>
      </div>`;
    grid.appendChild(card);

    const pitch = card.querySelector(`#finish-pitch-${pi}`);
    buildPitchSlots(pitch, p, p.color);
  });

}
