export function renderHeader(activePage = 'dashboard') {
  const container = document.getElementById('app-header');
  if (!container) return;

  const dashboardClass = activePage === 'dashboard' ? ' active' : '';
  const aboutClass = activePage === 'about' ? ' active' : '';

  container.innerHTML = `
    <div class="header-content">
      <div class="header-brand">
        <span class="header-logo">⛽</span>
        <div>
          <a href="index.html" style="text-decoration:none">
            <h1>FuelWatch Bolivia</h1>
          </a>
          <p class="header-tagline">Monitoreo colaborativo de combustible</p>
        </div>
      </div>
      <nav class="header-nav">
        <a href="index.html" class="nav-link${dashboardClass}">Dashboard</a>
        <a href="about.html" class="nav-link${aboutClass}">Acerca de</a>
        <div class="header-badge">
          <span class="badge-dot"></span>
          En línea
        </div>
        <button class="theme-toggle" id="theme-toggle" title="Cambiar tema">🌙</button>
      </nav>
    </div>
  `;
}
