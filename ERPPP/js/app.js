let systemOnline = true;
let sidebarOpen = true;

const MENU_CONFIG = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', href: 'dashboard.html' },
    { key: 'pedidos', label: 'Pedidos', icon: 'fa-receipt', href: 'pedidos.html' },
    { key: 'inventario', label: 'Inventario', icon: 'fa-boxes-stacked', href: 'inventario.html' },
    { key: 'empleados', label: 'Empleados', icon: 'fa-users', href: 'empleados.html' }
  ],
  cajero: [
    { key: 'pos', label: 'Punto de Venta', icon: 'fa-cash-register', href: 'pos.html' },
    { key: 'guardados', label: 'Guardar Pedido', icon: 'fa-bookmark', href: 'guardados.html' },
    { key: 'pedidos', label: 'Pedidos', icon: 'fa-receipt', href: 'pedidos.html' }
  ],
  cocina: [
    { key: 'cocina', label: 'Panel Cocina', icon: 'fa-fire-burner', href: 'cocina.html' }
  ]
};

const TITLES = {
  dashboard: { title: 'Dashboard', sub: 'Resumen operativo' },
  pedidos: { title: 'Pedidos', sub: 'Gestión de pedidos' },
  inventario: { title: 'Inventario', sub: 'Control de stock' },
  empleados: { title: 'Empleados', sub: 'Personal y usuarios' },
  pos: { title: 'Punto de Venta', sub: 'Registro de ventas' },
  cocina: { title: 'Panel Cocina', sub: 'Pedidos en preparación' },
  guardados: { title: 'Pedidos Guardados', sub: 'Pedidos en espera de pago' }
};

function getSession() {
  return JSON.parse(sessionStorage.getItem('mt_session'));
}

function requireAuth() {
  const s = getSession();
  if (!s) { window.location.href = '../index.html'; return null; }
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
  if (sidebarOpen) {
    sb.classList.add('open');
    if (window.innerWidth <= 768) ov.classList.add('active');
  } else {
    sb.classList.remove('open');
    ov.classList.remove('active');
  }
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

function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.classList.add('modal-open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  if (!document.querySelector('.modal-overlay.active')) document.body.classList.remove('modal-open');
}

function statusColor(estado) {
  const map = { pendiente: 'badge-warn', preparando: 'badge-info', entregado: 'badge-success', anulado: 'badge-danger' };
  return map[estado] || 'badge-muted';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
