// ══════════════════════════════════════════
// MAIN.JS — punto de entrada
// ══════════════════════════════════════════

// ── Tab switching ──────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    const isActive = panel.id === `tab-${name}`;
    panel.classList.toggle('active', isActive);
    panel.style.display = isActive ? 'block' : 'none';
  });

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

// ── Boot ───────────────────────────────────
switchTab('lobby');
renderPlayerSetup();