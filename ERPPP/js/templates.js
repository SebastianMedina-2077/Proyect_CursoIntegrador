/* Templates - Generadores HTML reutilizables */

function tplLayout(session, menu, info) {
  const navItems = menu.map(m =>
    `<a class="nav-item ${m.key === info.key ? 'active' : ''}" href="${m.href}">` +
    `<i class="fa-solid ${m.icon}"></i> <span>${m.label}</span></a>`
  ).join('');

  return `
  <section class="app-shell">
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    <aside class="sidebar open" id="sidebar">
      <div class="sidebar-brand">
        <img src="../assets/logo.png" class="sidebar-logo" alt="MT">
        <div class="sidebar-brand-text"><strong>Mamma Tomato</strong><span>ERP System</span></div>
      </div>
      <nav class="sidebar-nav">${navItems}</nav>
      <div class="sidebar-footer">
        <div class="sidebar-option" id="toggleOnline">
          <i class="fa-solid fa-wifi online-icon"></i>
          <span>En línea</span>
          <div class="toggle-switch active" id="toggleSwitch"><div class="toggle-knob"></div></div>
        </div>
        <button class="sidebar-option" onclick="handleLogout()">
          <i class="fa-solid fa-right-from-bracket"></i>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
    <main class="content" id="mainContent">
      <header class="topbar">
        <div class="topbar-left">
          <button class="btn-menu" id="btnMenuToggle"><i class="fa-solid fa-bars"></i></button>
          <div><h2>${info.title || ''}</h2><p>${info.sub || ''}</p></div>
        </div>
        <div class="topbar-actions">
          <span class="user-badge"><i class="fa-solid fa-circle-user"></i> ${session.nombre}</span>
        </div>
      </header>
      <section id="moduleContent" class="module-content fade-in"></section>
    </main>
    <footer class="status-bar">
      <div class="status-left">
        <span>Cajero: <strong>${session.nombre}</strong></span>
        <span class="status-sep">|</span>
        <span>Código: <strong>${session.codigo || session.username.toUpperCase()}</strong></span>
      </div>
      <div class="status-right" id="statusRight">
        <span>Sistema en línea</span>
        <i class="fa-solid fa-circle status-dot online"></i>
      </div>
    </footer>
  </section>`;
}

function tplModal(id, sizeClass, title, bodyId, footerHTML) {
  return `
  <div class="modal-overlay" id="${id}"><div class="modal-box ${sizeClass}">
    <div class="modal-header">
      <h4>${title}</h4>
      <button class="modal-close" onclick="closeModal('${id}')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body" ${bodyId ? `id="${bodyId}"` : ''}></div>
    <div class="modal-footer">${footerHTML}</div>
  </div></div>`;
}

function tplStatCard(icon, iconClass, label, value, delay) {
  return `
  <div class="stat-card stagger" style="animation-delay:${delay}ms">
    <div class="stat-icon ${iconClass}"><i class="fa-solid ${icon}"></i></div>
    <div class="stat-info"><span>${label}</span><strong>${value}</strong></div>
  </div>`;
}

function tplTable(headers, bodyHTML, bodyId) {
  const ths = headers.map(h => `<th>${h}</th>`).join('');
  return `
  <div class="table-wrap"><table>
    <thead><tr>${ths}</tr></thead>
    <tbody ${bodyId ? `id="${bodyId}"` : ''}>${bodyHTML}</tbody>
  </table></div>`;
}

function tplBadge(text, type) {
  return `<span class="badge ${type}">${text}</span>`;
}

function tplProductCard(p, index) {
  return `
  <div class="product-card stagger" style="animation-delay:${index * 30}ms">
    <div class="product-tag">${p.categoria}</div>
    <div class="product-name">${p.nombre}</div>
    <div class="product-price">S/ ${p.precio.toFixed(2)}</div>
    <div class="product-actions">
      <button class="btn btn-sm btn-primary" onclick="quickAdd(${p.id})"><i class="fa-solid fa-plus"></i> Agregar</button>
      <button class="btn btn-sm btn-outline" onclick="openPersonalizar(${p.id})"><i class="fa-solid fa-sliders"></i> Detalles</button>
    </div>
  </div>`;
}

function tplCartItem(item, i) {
  let mods = '';
  if (item.quitados.length) mods += `<span class="cart-mod">Sin: ${item.quitados.join(', ')}</span>`;
  if (item.extras.length) mods += `<span class="cart-mod">+${item.extras.map(e => e.nombre).join(', ')}</span>`;
  if (item.notas) mods += `<span class="cart-mod">${item.notas}</span>`;

  return `
  <div class="cart-item slide-in" style="animation-delay:${i * 50}ms">
    <div class="cart-item-info"><strong>${item.nombre}</strong>${mods}</div>
    <div class="cart-item-controls">
      <div class="qty-inline">
        <button onclick="cartQty(${i},-1)"><i class="fa-solid fa-minus"></i></button>
        <span>${item.cantidad}</span>
        <button onclick="cartQty(${i},1)"><i class="fa-solid fa-plus"></i></button>
      </div>
      <span class="cart-item-price">S/ ${(item.precio * item.cantidad).toFixed(2)}</span>
      <button class="btn-icon danger" onclick="cartRemove(${i})"><i class="fa-solid fa-trash"></i></button>
    </div>
  </div>`;
}

function tplReceipt(p) {
  const nro = `BOL-${new Date().getFullYear()}-${String(p.id).padStart(6, '0')}`;
  const mesa = p.mesa === 0 ? 'Para Llevar' : `Mesa ${p.mesa}`;

  const items = p.items.map(it => {
    let h = `<div class="receipt-item"><span class="ri-qty">${it.cantidad}</span><span class="ri-name">${it.nombre}</span><span class="ri-price">S/ ${(it.precio * it.cantidad).toFixed(2)}</span></div>`;
    if (it.quitados?.length) h += `<div class="receipt-mod">  -Sin: ${it.quitados.join(', ')}</div>`;
    if (it.extras?.length) h += `<div class="receipt-mod">  +${it.extras.map(e => e.nombre).join(', ')}</div>`;
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
    <div>BOLETA DE VENTA</div><div>Nro: ${nro}</div><div>Fecha: ${p.fecha}</div>
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

function tplPOSModals() {
  return `
  <div class="modal-overlay" id="modalPersonalizar"><div class="modal-box modal-md">
    <div class="modal-header"><h4 id="mpNombre"></h4><button class="modal-close" onclick="closeModal('modalPersonalizar')"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body" id="mpBody"></div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('modalPersonalizar')">Cancelar</button>
      <button class="btn btn-primary" id="mpAgregar">Agregar al pedido</button>
    </div>
  </div></div>

  <div class="modal-overlay" id="modalCliente"><div class="modal-box modal-md">
    <div class="modal-header"><h4>Datos del pedido</h4><button class="modal-close" onclick="closeModal('modalCliente')"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body">
      <form id="formCliente" class="needs-validation" novalidate>
        <div class="form-group"><label>Nombre del cliente</label><input type="text" id="cliNombre" class="form-control" required><div class="invalid-feedback">Ingrese el nombre del cliente</div></div>
        <div class="form-group"><label>Número de mesa</label><input type="number" id="cliMesa" class="form-control" min="0" required><small class="form-hint">Ingrese 0 para Para Llevar</small><div id="cliMesaBadge"></div><div class="invalid-feedback">Ingrese el número de mesa</div></div>
        <div class="form-group"><label>Teléfono <span class="text-muted">(opcional)</span></label><input type="tel" id="cliTelefono" class="form-control"></div>
        <div class="form-group"><label>Método de pago</label>
          <div class="radio-group">
            <label class="radio-label"><input type="radio" name="tipoPago" value="efectivo" checked> <i class="fa-solid fa-money-bill-wave"></i> Efectivo</label>
            <label class="radio-label"><input type="radio" name="tipoPago" value="yape"> <i class="fa-solid fa-mobile-screen"></i> Yape</label>
            <label class="radio-label"><input type="radio" name="tipoPago" value="tarjeta"> <i class="fa-solid fa-credit-card"></i> Tarjeta</label>
          </div>
        </div>
        <div class="order-summary"><h5>Resumen</h5><div id="cliResumen"></div><div class="cart-total"><span>Total</span><strong id="cliTotal"></strong></div></div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('modalCliente')">Cancelar</button>
      <button class="btn btn-primary" id="btnConfirmarCliente"><i class="fa-solid fa-check"></i> Confirmar Pedido</button>
    </div>
  </div></div>

  <div class="modal-overlay" id="modalUpsell"><div class="modal-box modal-lg">
    <div class="modal-header"><h4><i class="fa-solid fa-plus-circle"></i> ¿Desea agregar algo más?</h4><button class="modal-close" onclick="skipUpsell()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body"><div id="upsellGrid" class="upsell-grid"></div><div id="upsellAdded" class="upsell-added"></div></div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="skipUpsell()">No, gracias</button>
      <button class="btn btn-primary" onclick="confirmUpsell()"><i class="fa-solid fa-check"></i> Confirmar y Pagar</button>
    </div>
  </div></div>

  <div class="modal-overlay" id="modalRecibo"><div class="modal-box modal-receipt">
    <div id="reciboContent" class="receipt"></div>
    <div class="modal-footer receipt-actions">
      <button class="btn btn-outline" onclick="closeReceipt()"><i class="fa-solid fa-xmark"></i> Cerrar</button>
      <button class="btn btn-primary" onclick="printReceipt()"><i class="fa-solid fa-print"></i> Imprimir</button>
    </div>
  </div></div>`;
}
