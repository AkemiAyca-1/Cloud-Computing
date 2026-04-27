import { renderHeader } from './components/header.js'
import { renderFooter } from './components/footer.js'
import { initTheme } from './theme.js'

renderHeader('about');
renderFooter();
initTheme();

const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
reveals.forEach(el => observer.observe(el));
