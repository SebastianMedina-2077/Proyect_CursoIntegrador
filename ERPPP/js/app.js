/* app.js — Shell, auth, sidebar, utilidades globales */

let systemOnline = true;
let sidebarOpen = true;

const MENU_CONFIG = {
  admin: [
    { key:'dashboard', label:'Dashboard', icon:'fa-chart-line', href:'dashboard.html' },
    { key:'pedidos', label:'Pedidos', icon:'fa-receipt', href:'pedidos.html' },
    { key:'inventario', label:'Inventario', icon:'fa-boxes-stacked', href:'inventario.html' },
    { key:'empleados', label:'Empleados', icon:'fa-users', href:'empleados.html' }
  ],
  cajero: [
    { key:'pos', label:'Punto de Venta', icon:'fa-cash-register', href:'pos.html' },
    { key:'guardados', label:'Guardar Pedido', icon:'fa-bookmark', href:'guardados.html' },
    { key:'pedidos', label:'Pedidos', icon:'fa-receipt', href:'pedidos.html' }
  ],
  cocina: [
    { key:'cocina', label:'Panel Cocina', icon:'fa-fire-burner', href:'cocina.html' }
  ]
};

const TITLES = {
  dashboard: { title:'Dashboard', sub:'Resumen operativo' },
  pedidos:   { title:'Pedidos', sub:'Gestión de pedidos' },
  inventario:{ title:'Inventario', sub:'Control de stock' },
  empleados: { title:'Empleados', sub:'Personal y usuarios' },
  pos:       { title:'Punto de Venta', sub:'Registro de ventas' },
  cocina:    { title:'Panel Cocina', sub:'Pedidos en preparación' },
  guardados: { title:'Pedidos Guardados', sub:'Pedidos en espera de pago' }
};

// Permisos por página
const PAGE_ROLES = {
  dashboard: ['admin'],
  pedidos:   ['admin', 'cajero'],
  inventario:['admin'],
  empleados: ['admin'],
  pos:       ['cajero'],
  cocina:    ['cocina'],
  guardados: ['cajero']
};

function getSession() {
  return JSON.parse(sessionStorage.getItem('mt_session'));
}

// Auth con verificación de rol (Fix Bug #3)
function requireAuth(module) {
  const s = getSession();
  if (!s) { window.location.href = '../index.html'; return null; }
  const allowed = PAGE_ROLES[module];
  if (allowed && !allowed.includes(s.rol)) {
    const defaults = { admin:'dashboard.html', cajero:'pos.html', cocina:'cocina.html' };
    window.location.href = defaults[s.rol] || '../index.html';
    return null;
  }
  return s;
}

function buildLayout(session, activeModule) {
  const menu = MENU_CONFIG[session.rol] || [];
  const info = TITLES[activeModule] || {};
  info.key = activeModule;
  document.getElementById('app').innerHTML = tplLayout(session, menu, info);

  document.getElementById('btnMenuToggle').addEventListener('click', toggleSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', toggleSidebar);
  document.getElementById('toggleOnline').addEventListener('click', toggleSystemStatus);

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    sidebarOpen = false;
  }
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  sb.classList.toggle('open', sidebarOpen);
  if (window.innerWidth <= 768) ov.classList.toggle('active', sidebarOpen);
}

function toggleSystemStatus() {
  systemOnline = !systemOnline;
  const sw = document.getElementById('toggleSwitch');
  const right = document.getElementById('statusRight');
  if (systemOnline) {
    sw.classList.add('active');
    document.querySelector('#toggleOnline .online-icon').className = 'fa-solid fa-wifi online-icon';
    document.querySelector('#toggleOnline span').textContent = 'En línea';
    right.innerHTML = '<span>Sistema en línea</span><i class="fa-solid fa-circle status-dot online"></i>';
  } else {
    sw.classList.remove('active');
    document.querySelector('#toggleOnline .online-icon').className = 'fa-solid fa-plug-circle-xmark online-icon';
    document.querySelector('#toggleOnline span').textContent = 'Desconectado';
    right.innerHTML = '<span>Sistema desconectado</span><i class="fa-solid fa-circle status-dot offline"></i>';
  }
}

function handleLogout() {
  sessionStorage.removeItem('mt_session');
  window.location.href = '../index.html';
}

// Toast Bootstrap
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success:'fa-check-circle text-success', danger:'fa-exclamation-circle text-danger', warning:'fa-exclamation-triangle text-warning', info:'fa-info-circle text-info' };
  const id = 'toast-' + Date.now();
  container.insertAdjacentHTML('beforeend', `
    <div class="toast align-items-center border-0" id="${id}" role="alert">
      <div class="d-flex">
        <div class="toast-body"><i class="fa-solid ${icons[type]||icons.info} me-2"></i>${message}</div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`);
  const el = document.getElementById(id);
  new bootstrap.Toast(el, { delay: 3000 }).show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

// Utilidades
function statusColor(estado) {
  return { pendiente:'text-bg-warning', preparando:'text-bg-info', entregado:'text-bg-success', anulado:'text-bg-danger' }[estado] || 'text-bg-secondary';
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
