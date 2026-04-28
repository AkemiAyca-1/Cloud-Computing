import { createClient } from '@supabase/supabase-js'
import { renderHeader } from './components/header.js'
import { renderFooter } from './components/footer.js'
import { initTheme } from './theme.js'

renderHeader('dashboard');
renderFooter();

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById("form-reporte");
const tablaBody = document.getElementById("tabla-body");
const alertasContainer = document.getElementById("alertas");
const fechaInput = document.getElementById("fecha");
const canvasDonut = document.getElementById("chart-donut");
const canvasBarras = document.getElementById("chart-barras");
const canvasTimeline = document.getElementById("chart-timeline");
const canvasSaludables = document.getElementById("chart-saludables");
const modalOverlay = document.getElementById("modal-overlay");
const modalDetail = document.getElementById("modal-detail");
const modalConfirm = document.getElementById("modal-confirm");
const modalCancel = document.getElementById("modal-cancel");
const modalClose = document.getElementById("modal-close");

let reporteSeleccionado = null;

// Sistema de rate limiting por IP (1 hora global, no por surtidor)
const RATE_LIMIT_KEY = 'reportes_rate_limit_v2';
const RATE_LIMIT_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos
let userFingerprint = null;

// Obtener huella digital combinando IP + navegador
async function obtenerFingerprint() {
  if (userFingerprint) return userFingerprint;
  
  try {
    // Obtener IP publica
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const ip = data.ip;
    
    // Combinar con info del navegador para mayor unicidad
    const browserInfo = navigator.userAgent + navigator.language + screen.width + screen.height;
    userFingerprint = `${ip}_${btoa(browserInfo).slice(0, 20)}`;
    return userFingerprint;
  } catch {
    // Fallback: usar solo info del navegador si no se puede obtener IP
    const browserInfo = navigator.userAgent + navigator.language + screen.width + screen.height;
    userFingerprint = `local_${btoa(browserInfo).slice(0, 30)}`;
    return userFingerprint;
  }
}

function getRateLimitData() {
  try {
    const data = localStorage.getItem(RATE_LIMIT_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setRateLimitData(data) {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch {
    // Si localStorage no esta disponible, continuamos sin rate limiting
  }
}

async function puedeReportar() {
  const fingerprint = await obtenerFingerprint();
  const data = getRateLimitData();
  const lastReport = data[fingerprint];
  
  if (!lastReport) return { allowed: true };
  
  const ahora = Date.now();
  const tiempoRestante = RATE_LIMIT_DURATION - (ahora - lastReport);
  
  if (tiempoRestante <= 0) {
    return { allowed: true };
  }
  
  const minutos = Math.ceil(tiempoRestante / 60000);
  return { allowed: false, minutos };
}

async function registrarReporte() {
  const fingerprint = await obtenerFingerprint();
  const data = getRateLimitData();
  data[fingerprint] = Date.now();
  setRateLimitData(data);
}

function limpiarReportesExpirados() {
  const data = getRateLimitData();
  const ahora = Date.now();
  const dataLimpia = {};
  
  for (const [key, timestamp] of Object.entries(data)) {
    if (ahora - timestamp < RATE_LIMIT_DURATION) {
      dataLimpia[key] = timestamp;
    }
  }
  
  setRateLimitData(dataLimpia);
}

// Limpiar reportes expirados e inicializar fingerprint al cargar
limpiarReportesExpirados();
obtenerFingerprint();

// Obtener fecha local correctamente (evita problemas de timezone)
function obtenerFechaLocal() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

fechaInput.value = obtenerFechaLocal();
fechaInput.max = obtenerFechaLocal();

initTheme();

function mostrarNotificacion(mensaje, tipo = 'success') {
  document.querySelectorAll('.notification').forEach(n => n.remove());
  const notification = document.createElement('div');
  notification.className = `notification ${tipo}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${tipo === 'success' ? '✅' : '❌'}</span>
      <span class="notification-text">${mensaje}</span>
    </div>`;
  document.body.appendChild(notification);
  requestAnimationFrame(() => notification.classList.add('show'));
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 400);
  }, 4000);
}

function setLoading(loading) {
  const btn = form.querySelector('button[type="submit"]');
  if (loading) {
    btn.innerHTML = '<span class="spinner"></span> Registrando...';
    btn.disabled = true;
  } else {
    btn.innerHTML = '<span class="btn-text">Registrar Recarga</span>';
    btn.disabled = false;
  }
}

function animarContador(id, valorFinal) {
  const el = document.getElementById(id);
  const valorActual = parseInt(el.textContent) || 0;
  if (valorActual === valorFinal) return;
  const pasos = 25;
  const incremento = (valorFinal - valorActual) / pasos;
  let paso = 0;
  const intervalo = setInterval(() => {
    paso++;
    if (paso >= pasos) { el.textContent = valorFinal; clearInterval(intervalo); }
    else { el.textContent = Math.round(valorActual + incremento * paso); }
  }, 20);
}

function actualizarDashboard(data) {
  const total = data.length;
  const surtidores = new Set(data.map(d => d.surtidor)).size;
  const operables = data.filter(d => d.estado === "Operable").length;
  const fallas = data.filter(d => d.estado === "Falla detectada").length;
  animarContador("total-reportes", total);
  animarContador("total-surtidores", surtidores);
  animarContador("total-operables", operables);
  animarContador("total-fallas", fallas);
}

let chartDonutInstance = null;
let chartBarrasInstance = null;
let chartTimelineInstance = null;
let chartSaludablesInstance = null;

function renderCharts(data) {
  const operables = data.filter(d => d.estado === "Operable").length;
  const fallas = data.filter(d => d.estado === "Falla detectada").length;

  if (chartDonutInstance) chartDonutInstance.destroy();
  chartDonutInstance = new Chart(canvasDonut, {
    type: 'doughnut',
    data: {
      labels: ['Operable', 'Falla detectada'],
      datasets: [{
        data: [operables, fallas],
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: ['#059669', '#dc2626'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 } },
        tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: 'rgba(148,163,184,0.2)', borderWidth: 1, padding: 12, cornerRadius: 8 }
      }
    }
  });

  const porSurtidor = {};
  data.forEach(item => {
    if (!porSurtidor[item.surtidor]) porSurtidor[item.surtidor] = { ok: 0, fail: 0 };
    if (item.estado === "Operable") porSurtidor[item.surtidor].ok++;
    else porSurtidor[item.surtidor].fail++;
  });
  const labels = Object.keys(porSurtidor);
  const okData = labels.map(l => porSurtidor[l].ok);
  const failData = labels.map(l => porSurtidor[l].fail);

  if (chartBarrasInstance) chartBarrasInstance.destroy();
  chartBarrasInstance = new Chart(canvasBarras, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Operable', data: okData, backgroundColor: 'rgba(16,185,129,0.7)', borderColor: '#10b981', borderWidth: 1, borderRadius: 4 },
        { label: 'Falla', data: failData, backgroundColor: 'rgba(239,68,68,0.7)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: { stacked: true, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(148,163,184,0.08)' } },
        y: { stacked: true, beginAtZero: true, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, stepSize: 1 }, grid: { color: 'rgba(148,163,184,0.08)' } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 } },
        tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: 'rgba(148,163,184,0.2)', borderWidth: 1, padding: 12, cornerRadius: 8 }
      }
    }
  });
}

function renderTimeline(data) {
  const fallas = data.filter(d => d.estado === "Falla detectada");
  const porFecha = {};
  fallas.forEach(item => {
    porFecha[item.fecha] = (porFecha[item.fecha] || 0) + 1;
  });

  const allDates = [...new Set(data.map(d => d.fecha))].sort();
  const labels = allDates.map(f => new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
  const fallasData = allDates.map(f => porFecha[f] || 0);

  const totalPorFecha = {};
  data.forEach(item => {
    totalPorFecha[item.fecha] = (totalPorFecha[item.fecha] || 0) + 1;
  });
  const totalData = allDates.map(f => totalPorFecha[f] || 0);

  if (chartTimelineInstance) chartTimelineInstance.destroy();
  chartTimelineInstance = new Chart(canvasTimeline, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Total reportes',
          data: totalData,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
          pointHoverRadius: 7
        },
        {
          label: 'Fallas detectadas',
          data: fallasData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444',
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(148,163,184,0.08)' } },
        y: { beginAtZero: true, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, stepSize: 1 }, grid: { color: 'rgba(148,163,184,0.08)' } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 } },
        tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#94a3b8', borderColor: 'rgba(148,163,184,0.2)', borderWidth: 1, padding: 12, cornerRadius: 8 }
      }
    }
  });
}

function renderChartsSaludables(data) {
  // Calcular surtidores saludables (sin fallas) vs con problemas
  const surtidoresStats = {};

  data.forEach(item => {
    if (!surtidoresStats[item.surtidor]) {
      surtidoresStats[item.surtidor] = { total: 0, fallas: 0 };
    }
    surtidoresStats[item.surtidor].total++;
    if (item.estado === "Falla detectada") {
      surtidoresStats[item.surtidor].fallas++;
    }
  });

  const saludables = Object.values(surtidoresStats).filter(stats => stats.fallas === 0).length;
  const conProblemas = Object.values(surtidoresStats).filter(stats => stats.fallas > 0).length;
  const totalSurtidores = Object.keys(surtidoresStats).length;

  if (chartSaludablesInstance) chartSaludablesInstance.destroy();

  chartSaludablesInstance = new Chart(canvasSaludables, {
    type: 'doughnut',
    data: {
      labels: ['Saludables (Sin fallas)', 'Con problemas'],
      datasets: [{
        data: [saludables, conProblemas],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderColor: ['#059669', '#d97706'],
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#f1f5f9',
            font: { family: 'Inter', size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            generateLabels: function(chart) {
              const data = chart.data;
              return data.labels.map((label, i) => ({
                text: `${label}: ${data.datasets[0].data[i]} surtidores`,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].borderColor[i],
                fontColor: '#f1f5f9',
                lineWidth: 2,
                hidden: false,
                index: i
              }));
            }
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(148,163,184,0.2)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} surtidores (${percentage}%)`;
            }
          }
        },
        title: {
          display: true,
          text: `Total: ${totalSurtidores} surtidores registrados`,
          color: '#64748b',
          font: { family: 'Inter', size: 14, weight: '500' },
          padding: { bottom: 20 }
        }
      }
    }
  });
}

async function cargarDatos() {
  tablaBody.innerHTML = `<tr class="loading-row"><td colspan="4" style="text-align:center;padding:2.5rem;">
    <div class="loading-spinner"></div>
    <p style="margin-top:1rem;color:var(--text-secondary);font-size:0.85rem;">Cargando reportes...</p>
  </td></tr>`;

  try {
    const { data, error } = await supabaseClient
      .from("reportes").select("*").order("fecha", { ascending: false });

    if (error) {
      console.error('Error cargando datos:', error);
      mostrarNotificacion('Error al cargar los reportes', 'error');
      tablaBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2.5rem;color:var(--danger);">
        ❌ Error al cargar los datos.</td></tr>`;
      return;
    }
    // Tabla muestra solo los 10 mas recientes, pero alertas y graficos usan TODOS los datos
    const dataTabla = data.slice(0, 10);
    renderTabla(dataTabla, data);
    actualizarDashboard(data);
    renderCharts(data);
    renderChartsSaludables(data);
    renderTimeline(data);
  } catch (err) {
    console.error('Error inesperado:', err);
    mostrarNotificacion('Error inesperado al cargar datos', 'error');
  }
}

function formatearFecha(fechaStr) {
  // Evita el problema de timezone interpretando la fecha como local
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  return fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderTabla(dataTabla, todosLosDatos) {
  tablaBody.innerHTML = "";
  if (dataTabla.length === 0) {
    tablaBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:3rem;color:var(--text-secondary);">
      📝 No hay reportes registrados aún.<br><small>Sé el primero en agregar un reporte.</small></td></tr>`;
    alertasContainer.innerHTML = "";
    return;
  }
  
  // Calcular alertas basadas en TODOS los datos, no solo los 10 mostrados
  const alertas = {};
  todosLosDatos.forEach((item) => {
    if (item.estado === "Falla detectada") {
      alertas[item.surtidor] = (alertas[item.surtidor] || 0) + 1;
    }
  });
  
  const fragment = document.createDocumentFragment();

  dataTabla.forEach((item, index) => {
    const estadoClass = item.estado === "Operable" ? "estado-operable" : "estado-falla";
    const fechaF = formatearFecha(item.fecha);
    const tr = document.createElement('tr');
    tr.setAttribute('data-index', index);

    let accionHTML;
    if (item.estado === "Operable") {
      accionHTML = `<button class="btn-reportar-falla" data-id="${item.id}" data-surtidor="${item.surtidor}" data-fecha="${item.fecha}">Reportar falla</button>`;
    } else {
      accionHTML = `<span class="estado-ya-reportado">Ya reportado</span>`;
    }

    tr.innerHTML = `
      <td data-label="Surtidor"><span class="surtidor-nombre">${item.surtidor}</span></td>
      <td data-label="Fecha"><span class="fecha-display">${fechaF}</span></td>
      <td data-label="Estado"><span class="estado-badge ${estadoClass}">${item.estado === "Operable" ? "Operable" : "Falla detectada"}</span></td>
      <td data-label="">${accionHTML}</td>`;
    fragment.appendChild(tr);
  });

  tablaBody.appendChild(fragment);
  setTimeout(() => {
    tablaBody.querySelectorAll('tr').forEach((row, i) => {
      row.style.animationDelay = `${i * 0.05}s`;
      row.classList.add('fade-in-row');
    });
  }, 50);

  tablaBody.querySelectorAll('.btn-reportar-falla').forEach(btn => {
    btn.addEventListener('click', () => abrirModal(btn.dataset.id, btn.dataset.surtidor, btn.dataset.fecha));
  });

  mostrarAlertas(alertas);
}

let surtidorActual = null;

async function abrirModal(id, surtidor, fecha) {
  // Verificar rate limiting por IP
  const rateCheck = await puedeReportar();
  if (!rateCheck.allowed) {
    mostrarNotificacion(`Ya enviaste un reporte recientemente. Intenta de nuevo en ${rateCheck.minutos} minuto${rateCheck.minutos > 1 ? 's' : ''}.`, 'error');
    return;
  }
  
  reporteSeleccionado = id;
  surtidorActual = surtidor;
  const fechaF = formatearFecha(fecha);
  modalDetail.innerHTML = `<strong>${surtidor}</strong><br>Fecha de carga: ${fechaF}`;
  
  modalOverlay.classList.remove('hidden');
}

function cerrarModal() {
  modalOverlay.classList.add('hidden');
  reporteSeleccionado = null;
  surtidorActual = null;
}

modalCancel.addEventListener('click', cerrarModal);
modalClose.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) cerrarModal(); });

modalConfirm.addEventListener('click', async () => {
  if (!reporteSeleccionado) return;
  modalConfirm.disabled = true;
  modalConfirm.textContent = 'Actualizando...';

  try {
    const { error } = await supabaseClient
      .from("reportes")
      .update({ estado: 'Falla detectada', updated_at: new Date().toISOString() })
      .eq("id", reporteSeleccionado);

    if (error) {
      console.error('Error actualizando:', error);
      mostrarNotificacion('Error al reportar la falla', 'error');
    } else {
      // Registrar en localStorage para rate limiting por IP
      await registrarReporte();
      mostrarNotificacion('Falla reportada exitosamente', 'success');
      await cargarDatos();
    }
  } catch (err) {
    console.error('Error inesperado:', err);
    mostrarNotificacion('Error inesperado', 'error');
  } finally {
    modalConfirm.disabled = false;
    modalConfirm.textContent = 'Confirmar Falla';
    cerrarModal();
  }
});

function mostrarAlertas(alertas) {
  alertasContainer.innerHTML = "";
  const arr = Object.entries(alertas).filter(([, c]) => c >= 2);
  if (arr.length === 0) {
    alertasContainer.innerHTML = `<div class="no-alerts"><span class="no-alerts-icon">✅</span>
      <p>No hay alertas activas. Todos los surtidores funcionan correctamente.</p></div>`;
    return;
  }
  arr.forEach(([surtidor, count]) => {
    const div = document.createElement('div');
    div.className = 'alerta-item';
    div.innerHTML = `<div class="alerta-header"><span class="alerta-icon">🚨</span>
      <span class="alerta-titulo">${surtidor}</span></div>
      <div class="alerta-contenido"><p>Este surtidor tiene <strong>${count}</strong> reportes de falla detectada.</p>
      <small>Se recomienda evitar este surtidor hasta nuevo aviso.</small></div>`;
    alertasContainer.appendChild(div);
  });
}

function validarFormulario() {
  let isValid = true;
  document.querySelectorAll('.error-message').forEach(el => el.remove());
  const surtidor = document.getElementById("surtidor").value.trim();
  const fecha = document.getElementById("fecha").value;

  if (!surtidor) { mostrarErrorCampo('surtidor', 'El nombre del surtidor es obligatorio'); isValid = false; }
  else if (surtidor.length < 2) { mostrarErrorCampo('surtidor', 'Mínimo 2 caracteres'); isValid = false; }

  if (!fecha) { mostrarErrorCampo('fecha', 'La fecha es obligatoria'); isValid = false; }
  else {
    const f = new Date(fecha), hoy = new Date(); hoy.setHours(0,0,0,0);
    if (f > hoy) { mostrarErrorCampo('fecha', 'La fecha no puede ser futura'); isValid = false; }
  }
  return isValid;
}

function mostrarErrorCampo(campoId, mensaje) {
  const campo = document.getElementById(campoId);
  const wrapper = campo.closest('.form-group');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = `⚠️ ${mensaje}`;
  wrapper.appendChild(errorDiv);
  campo.style.borderColor = 'var(--danger)';
  setTimeout(() => { errorDiv.remove(); campo.style.borderColor = ''; }, 3000);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validarFormulario()) return;
  
  const surtidor = document.getElementById("surtidor").value.trim();
  const fecha = document.getElementById("fecha").value;

  // Verificar rate limiting por IP antes de registrar
  const rateCheck = await puedeReportar();
  if (!rateCheck.allowed) {
    mostrarNotificacion(`Ya registraste una recarga recientemente. Intenta de nuevo en ${rateCheck.minutos} minuto${rateCheck.minutos > 1 ? 's' : ''}.`, 'error');
    return;
  }

  setLoading(true);

  try {
    const { error } = await supabaseClient
      .from("reportes").insert([{ surtidor, fecha, estado: "Operable" }]);

    if (error) {
      console.error('Error guardando:', error);
      mostrarNotificacion('Error al guardar el reporte', 'error');
    } else {
      // Registrar en localStorage para rate limiting por IP
      await registrarReporte();
      mostrarNotificacion('Recarga registrada exitosamente', 'success');
      form.classList.add('success-animation');
      setTimeout(() => form.classList.remove('success-animation'), 800);
      form.reset();
      fechaInput.value = obtenerFechaLocal();
      setTimeout(() => cargarDatos(), 300);
    }
  } catch (err) {
    console.error('Error inesperado:', err);
    mostrarNotificacion('Error inesperado', 'error');
  } finally { setLoading(false); }
});

document.getElementById("surtidor").addEventListener("input", function() {
  this.style.borderColor = '';
  const err = this.closest('.form-group').querySelector('.error-message');
  if (err) err.remove();
});

cargarDatos();
