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
    renderFormations();
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