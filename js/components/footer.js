export function renderFooter() {
  const container = document.getElementById('app-footer');
  if (!container) return;

  container.innerHTML = `
    <div class="footer-content">
      <div class="footer-left">
        <p class="footer-text">FuelWatch Bolivia &copy; 2026 — Proyecto de Computación en la Nube</p>
        <p class="footer-team">Desarrollado por <strong>DATA DRIFTERS</strong></p>
      </div>
      <div class="footer-tech">
        <span class="tech-badge">Supabase</span>
        <span class="tech-badge">Vite</span>
        <span class="tech-badge">Vercel</span>
      </div>
    </div>
  `;
}
