export function initTheme() {
  const saved = localStorage.getItem('fw-theme');
  if (saved === 'light') document.body.classList.add('light-theme');

  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  btn.textContent = document.body.classList.contains('light-theme') ? '🌙' : '☀️';

  btn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    btn.textContent = isLight ? '🌙' : '☀️';
    localStorage.setItem('fw-theme', isLight ? 'light' : 'dark');
  });
}
