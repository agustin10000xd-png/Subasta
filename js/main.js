// ══════════════════════════════════════════
// MAIN.JS — punto de entrada
// ══════════════════════════════════════════

// ── Tab switching ──────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === name)
  );
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');

  if (name === 'formations') {
    // Pausar timer al ir a formaciones
    state.timerPaused = true;
    clearInterval(state.timerInterval);
    renderFormations();
  } else if (name === 'auction' && state.timerPaused && !state.auctionFinished) {
    // Reanudar timer al volver a subasta
    state.timerPaused = false;
    startTimer();
  }
}

// ── Listeners globales ─────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!btn.disabled) switchTab(btn.dataset.tab);
  });
});

document.getElementById('back-to-auction').addEventListener('click', () => switchTab('auction'));

// ── Boot ───────────────────────────────────
renderPlayerSetup();