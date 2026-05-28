/* templates.js — Generadores HTML dinámicos (Bootstrap 5) */

function tplLayout(session, menu, info) {
  const navItems = menu.map(m =>
    `<a class="nav-link sidebar-link ${m.key === info.key ? 'active' : ''}" href="${m.href}">
      <i class="fa-solid ${m.icon}"></i> <span>${m.label}</span></a>`
  ).join('');

  return `
  <section class="app-shell">
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <aside class="sidebar open" id="sidebar">
      <div class="sidebar-brand">
        <img src="../assets/logo.png" alt="MT">
        <div><strong class="d-block">Mamma Tomato</strong><small class="text-muted">ERP System</small></div>
      </div>
      <nav class="sidebar-nav">${navItems}</nav>
      <div class="sidebar-footer">
        <div class="sidebar-option" id="toggleOnline">
          <i class="fa-solid fa-wifi online-icon"></i>
          <span>En línea</span>
          <div class="toggle-switch active" id="toggleSwitch"><div class="toggle-knob"></div></div>
        </div>
        <button class="sidebar-option" onclick="handleLogout()">
          <i class="fa-solid fa-right-from-bracket"></i><span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
    <main class="content" id="mainContent">
      <header class="card mb-3">
        <div class="card-body py-2 px-3 d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-3">
            <button class="btn btn-light btn-sm" id="btnMenuToggle"><i class="fa-solid fa-bars"></i></button>
            <div><h5 class="mb-0">${info.title || ''}</h5><small class="text-muted">${info.sub || ''}</small></div>
          </div>
          <span class="badge bg-brand-light text-brand-dark rounded-pill px-3 py-2">
            <i class="fa-solid fa-circle-user me-1"></i>${session.nombre}
          </span>
        </div>
      </header>
      <section id="moduleContent" class="fade-in"></section>
    </main>
    <footer class="status-bar">
      <div class="d-flex align-items-center gap-2">
        <span>Cajero: <strong>${session.nombre}</strong></span>
        <span class="opacity-25">|</span>
        <span>Código: <strong>${session.codigo || session.username.toUpperCase()}</strong></span>
      </div>
      <div class="d-flex align-items-center gap-2" id="statusRight">
        <span>Sistema en línea</span>
        <i class="fa-solid fa-circle status-dot online"></i>
      </div>
    </footer>
  </section>`;
}

function tplStatCard(icon, colorClass, label, value, delay) {
  const colors = { '':'bg-brand-light text-brand', warn:'bg-warning-subtle text-warning', success:'bg-success-subtle text-success', danger:'bg-danger-subtle text-danger' };
  return `
  <div class="card stagger p-3" style="animation-delay:${delay}ms">
    <div class="d-flex align-items-center gap-3">
      <div class="stat-icon ${colors[colorClass]||colors['']}"><i class="fa-solid ${icon}"></i></div>
      <div><small class="text-muted">${label}</small><strong class="d-block fs-5">${value}</strong></div>
    </div>
  </div>`;
}

function tplBadge(text, type) {
  return `<span class="badge ${type}">${text}</span>`;
}

function tplTable(headers, bodyHTML, bodyId) {
  return `
  <div class="table-responsive">
    <table class="table table-hover align-middle mb-0">
      <thead class="table-light"><tr>${headers.map(h => `<th class="small text-uppercase text-muted">${h}</th>`).join('')}</tr></thead>
      <tbody ${bodyId ? `id="${bodyId}"` : ''}>${bodyHTML}</tbody>
    </table>
  </div>`;
}

function tplProductCard(p, index) {
  return `
  <div class="card product-card stagger" style="animation-delay:${index*30}ms">
    <div class="card-body p-2">
      <small class="text-muted text-uppercase" style="font-size:10px">${p.categoria}</small>
      <h6 class="card-title mb-1 text-truncate">${p.nombre}</h6>
      <div class="fw-bold text-brand-dark mb-2">S/ ${p.precio.toFixed(2)}</div>
      <div class="d-flex gap-1">
        <button class="btn btn-brand btn-sm flex-grow-1" onclick="quickAdd(${p.id})"><i class="fa-solid fa-plus"></i> Agregar</button>
        <button class="btn btn-outline-secondary btn-sm" onclick="openPersonalizar(${p.id})" title="Personalizar"><i class="fa-solid fa-sliders"></i></button>
      </div>
    </div>
  </div>`;
}

function tplCartItem(item, i) {
  let mods = '';
  if (item.quitados.length) mods += `<small class="d-block text-muted">Sin: ${item.quitados.join(', ')}</small>`;
  if (item.extras.length) mods += `<small class="d-block text-muted">+${item.extras.map(e=>e.nombre).join(', ')}</small>`;
  if (item.notas) mods += `<small class="d-block text-muted">${item.notas}</small>`;

  return `
  <div class="d-flex justify-content-between align-items-start py-2 border-bottom slide-in" style="animation-delay:${i*50}ms">
    <div class="flex-grow-1">
      <strong class="d-block small">${item.nombre}</strong>${mods}
    </div>
    <div class="d-flex align-items-center gap-2 ms-2">
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" onclick="cartQty(${i},-1)"><i class="fa-solid fa-minus"></i></button>
        <span class="btn btn-outline-secondary disabled">${item.cantidad}</span>
        <button class="btn btn-outline-secondary" onclick="cartQty(${i},1)"><i class="fa-solid fa-plus"></i></button>
      </div>
      <span class="fw-semibold small text-nowrap">S/ ${(item.precio * item.cantidad).toFixed(2)}</span>
      <button class="btn btn-sm btn-outline-danger" onclick="cartRemove(${i})"><i class="fa-solid fa-trash"></i></button>
    </div>
  </div>`;
}

function tplReceipt(p) {
  const nro = `BOL-${new Date().getFullYear()}-${String(p.id).padStart(6,'0')}`;
  const mesa = p.mesa === 0 ? 'Para Llevar' : `Mesa ${p.mesa}`;
  const items = p.items.map(it => {
    let h = `<div class="receipt-item"><span class="ri-qty">${it.cantidad}</span><span class="ri-name">${it.nombre}</span><span class="ri-price">S/ ${(it.precio*it.cantidad).toFixed(2)}</span></div>`;
    if (it.quitados?.length) h += `<div class="receipt-mod">  -Sin: ${it.quitados.join(', ')}</div>`;
    if (it.extras?.length) h += `<div class="receipt-mod">  +${it.extras.map(e=>e.nombre).join(', ')}</div>`;
    if (it.notas) h += `<div class="receipt-mod">  ${it.notas}</div>`;
    return h;
  }).join('');

  return `
  <div class="receipt-header">
    <img src="../assets/logo.png" class="receipt-logo" alt="Mamma Tomato">
    <div class="receipt-brand">MAMMA TOMATO</div>
    <div class="receipt-sub">Pizza & Focaccia</div>
    <div class="receipt-info">RUC: 20XXXXXXXXXX</div>
    <div class="receipt-info">Lima, Perú</div>
  </div>
  <div class="receipt-divider"></div>
  <div class="receipt-meta">
    <div>BOLETA DE VENTA</div><div>Nro: ${nro}</div><div>Fecha: ${formatDate(p.fecha)}</div>
    <div>Cajero: ${p.cajero}</div><div>${mesa}</div><div>Cliente: ${p.cliente}</div>
  </div>
  <div class="receipt-divider"></div>
  <div class="receipt-cols"><span>Cant</span><span>Descripción</span><span>Precio</span></div>
  <div class="receipt-divider thin"></div>
  ${items}
  <div class="receipt-divider"></div>
  <div class="receipt-totals">
    <div><span>Subtotal:</span><span>S/ ${p.subtotal.toFixed(2)}</span></div>
    <div class="receipt-grand"><span>TOTAL:</span><span>S/ ${p.total.toFixed(2)}</span></div>
    <div><span>Pago:</span><span>${capitalize(p.tipoPago)}</span></div>
  </div>
  <div class="receipt-divider"></div>
  <div class="receipt-footer">
    <div class="receipt-barcode">${nro}</div>
    <div>Gracias por su preferencia</div>
    <div>www.mammatomato.com.pe</div>
  </div>`;
}
