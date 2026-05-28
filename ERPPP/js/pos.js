/* pos.js — Punto de Venta */

// ── STATE ──
let cart = [];
let posProductos = [];
let posCategorias = [];
let posAdicionales = [];
let savedOrders = JSON.parse(localStorage.getItem('mt_saved_orders') || '[]');
let pendingOrder = null;
let upsellItems = [];

// ── SERVICE ──
function saveCart() { sessionStorage.setItem('mt_cart', JSON.stringify(cart)); }
function loadCart() { const s = sessionStorage.getItem('mt_cart'); if (s) cart = JSON.parse(s); }
function getCartTotal() { return cart.reduce((s, c) => s + c.precio * c.cantidad, 0); }

async function loadPOSData() {
  posCategorias = await dbGetAll('categorias');
  posProductos = await dbGetAll('productos');
  posAdicionales = await dbGetAll('adicionales');
}

function addToCart(prodId) {
  const prod = posProductos.find(p => p.id === prodId);
  if (!prod) return;
  const existing = cart.find(c => c.prodId === prodId && !c.notas && !c.quitados.length && !c.extras.length);
  if (existing) existing.cantidad++;
  else cart.push({ prodId, nombre: prod.nombre, precio: prod.precio, cantidad: 1, notas: '', quitados: [], extras: [] });
  saveCart();
}

function addCustomToCart(prodId, qty, notas, quitados, extras) {
  const prod = posProductos.find(p => p.id === prodId);
  if (!prod) return;
  const extraTotal = extras.reduce((s, e) => s + e.precio, 0);
  cart.push({ prodId, nombre: prod.nombre, precio: prod.precio + extraTotal, cantidad: qty, notas, quitados, extras });
  saveCart();
}

function updateCartQty(i, delta) {
  cart[i].cantidad += delta;
  if (cart[i].cantidad < 1) cart.splice(i, 1);
  saveCart();
}

function removeCartItem(i) { cart.splice(i, 1); saveCart(); }

function saveOrderOnHold() {
  if (!cart.length) return false;
  const session = getSession();
  savedOrders.push({
    id: Date.now(), fecha: new Date().toISOString(),
    cajero: session.nombre, items: [...cart], total: getCartTotal()
  });
  localStorage.setItem('mt_saved_orders', JSON.stringify(savedOrders));
  cart = [];
  saveCart();
  return true;
}

function recoverHeldOrder(index) {
  const order = savedOrders[index];
  if (!order) return false;
  if (cart.length > 0 && !confirm('Ya tienes productos en el carrito. ¿Reemplazar?')) return false;
  cart = [...order.items];
  saveCart();
  savedOrders.splice(index, 1);
  localStorage.setItem('mt_saved_orders', JSON.stringify(savedOrders));
  return true;
}

function deleteHeldOrder(index) {
  savedOrders.splice(index, 1);
  localStorage.setItem('mt_saved_orders', JSON.stringify(savedOrders));
}

async function createOrder(clienteData) {
  upsellItems.forEach(u => cart.push({ prodId: null, nombre: u.nombre, precio: u.precio, cantidad: u.cantidad, notas: '', quitados: [], extras: [] }));
  const total = getCartTotal();
  const session = getSession();

  const pedido = {
    fecha: new Date().toISOString(),
    cliente: clienteData.nombre, mesa: clienteData.mesa,
    telefono: clienteData.telefono, cajero: session.nombre,
    estado: 'pendiente',
    items: cart.map(c => ({ nombre: c.nombre, precio: c.precio, cantidad: c.cantidad, notas: c.notas, quitados: c.quitados, extras: c.extras })),
    subtotal: total, total,
    tipoPago: clienteData.tipoPago,
    tipo: clienteData.mesa === 0 ? 'llevar' : 'mesa'
  };

  const id = await dbAdd('pedidos', pedido);
  pedido.id = id;
  cart = [];
  saveCart();
  return pedido;
}

// ── VIEW ──
function buildPOSLayout() {
  const catBtns = `<button class="cat-btn active" data-cat="all"><i class="fa-solid fa-border-all"></i> Todos</button>` +
    posCategorias.map(c => `<button class="cat-btn" data-cat="${c.nombre}"><i class="fa-solid ${c.icono}"></i> ${c.nombre}</button>`).join('');

  return `
    <div class="pos-layout fade-in">
      <aside class="pos-categories card p-3">
        <h6 class="text-uppercase text-muted small mb-2">Categorías</h6>
        <div id="posCatList">${catBtns}</div>
      </aside>
      <section class="card p-3">
        <div class="input-group mb-3">
          <span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span>
          <input type="text" id="posSearchInput" class="form-control" placeholder="Buscar producto...">
        </div>
        <div id="posProductGrid" class="product-grid"></div>
      </section>
      <aside class="pos-cart card p-3">
        <h6><i class="fa-solid fa-cart-shopping me-2"></i>Pedido actual</h6>
        <div id="posCartItems" class="cart-items"></div>
        <div class="border-top pt-3 mt-2">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-semibold">Total</span>
            <strong class="fs-5 text-brand-dark" id="posCartTotal">S/ 0.00</strong>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary" id="btnGuardarPedido" disabled><i class="fa-solid fa-bookmark"></i> Guardar</button>
            <button class="btn btn-brand flex-grow-1" id="btnGenerarOrden" disabled><i class="fa-solid fa-receipt"></i> Generar Orden</button>
          </div>
        </div>
      </aside>
    </div>`;
}

function buildProductGrid(cat, search) {
  let list = posProductos.filter(p => p.disponible);
  if (cat !== 'all') list = list.filter(p => p.categoria === cat);
  if (search) list = list.filter(p => p.nombre.toLowerCase().includes(search));
  return list.length
    ? list.map((p, i) => tplProductCard(p, i)).join('')
    : '<p class="text-center text-muted py-4">Sin productos disponibles</p>';
}

function buildCartView() {
  if (!cart.length) return '<div class="empty-cart"><i class="fa-solid fa-cart-shopping"></i><p class="small mt-2">Sin productos</p></div>';
  return cart.map((item, i) => tplCartItem(item, i)).join('');
}

function buildPersonalizarBody(prod) {
  let html = '';
  if (prod.ingredientes?.length) {
    html += '<h6 class="mb-2">Ingredientes <small class="text-muted fw-normal">Desmarque lo que no desea</small></h6>';
    prod.ingredientes.forEach(i => { html += `<div class="form-check"><input class="form-check-input" type="checkbox" checked value="${i}" id="ing_${i}"><label class="form-check-label" for="ing_${i}">${i}</label></div>`; });
    html += '<hr>';
  }
  if (prod.extras?.length) {
    html += '<h6 class="mb-2">Extras</h6>';
    prod.extras.forEach((e, idx) => { html += `<div class="form-check"><input class="form-check-input" type="checkbox" data-extra='${JSON.stringify(e)}' id="ext_${idx}"><label class="form-check-label" for="ext_${idx}">${e.nombre} (+S/ ${e.precio.toFixed(2)})</label></div>`; });
    html += '<hr>';
  }
  html += `<div class="mb-3"><label class="form-label">Notas</label><textarea id="mpNotas" class="form-control" rows="2" placeholder="Instrucciones..."></textarea></div>`;
  html += `<div class="d-flex align-items-center gap-2"><label class="form-label mb-0">Cantidad</label><button type="button" class="btn btn-outline-secondary btn-sm" id="mpQtyM">-</button><input type="number" id="mpQty" value="1" min="1" class="form-control form-control-sm text-center" style="width:60px"><button type="button" class="btn btn-outline-secondary btn-sm" id="mpQtyP">+</button></div>`;
  return html;
}

function buildClienteResumen() {
  return cart.map(c =>
    `<div class="d-flex justify-content-between small"><span>${c.cantidad}x ${c.nombre}</span><span>S/ ${(c.precio * c.cantidad).toFixed(2)}</span></div>`
  ).join('');
}

function buildUpsellGrid() {
  return posAdicionales.filter(a => a.disponible).map(a =>
    `<div class="card upsell-card p-2">
      <strong class="small">${a.nombre}</strong>
      <div class="text-brand fw-bold small mb-1">S/ ${a.precio.toFixed(2)}</div>
      <button class="btn btn-brand btn-sm" onclick="addUpsell('${a.nombre}',${a.precio})"><i class="fa-solid fa-plus"></i></button>
    </div>`
  ).join('');
}

function buildGuardadosView() {
  if (!savedOrders.length) {
    return '<div class="text-center text-muted py-5"><i class="fa-solid fa-bookmark fs-1 opacity-25 d-block mb-2"></i><p>Sin pedidos guardados</p></div>';
  }
  return `<div class="saved-grid fade-in">${savedOrders.map((o, i) => `
    <div class="card stagger" style="animation-delay:${i * 60}ms">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="mb-0">Pedido #${i + 1}</h6>
          <span class="badge text-bg-warning">En espera</span>
        </div>
        <small class="text-muted d-block"><i class="fa-solid fa-clock me-1"></i>${formatDate(o.fecha)}</small>
        <small class="text-muted d-block mb-2"><i class="fa-solid fa-user me-1"></i>${o.cajero}</small>
        <ul class="list-unstyled border-top border-bottom py-2 mb-2">
          ${o.items.map(it => `<li class="small">${it.cantidad}x ${it.nombre}</li>`).join('')}
        </ul>
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span>Total:</span><strong class="text-brand-dark fs-5">S/ ${o.total.toFixed(2)}</strong>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-brand flex-grow-1" onclick="recuperarPedido(${i})"><i class="fa-solid fa-rotate-left"></i> Recuperar</button>
          <button class="btn btn-outline-danger" onclick="eliminarGuardado(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('')}</div>`;
}

// ── CONTROLLER ──
async function renderPOS() {
  loadCart();
  await loadPOSData();
  document.getElementById('moduleContent').innerHTML = buildPOSLayout();
  renderPosProducts('all');
  renderPosCart();
  bindPosEvents();
}

function bindPosEvents() {
  document.querySelectorAll('.cat-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderPosProducts(btn.dataset.cat);
  }));
  document.getElementById('posSearchInput').addEventListener('input', e => {
    const cat = document.querySelector('.cat-btn.active')?.dataset.cat || 'all';
    renderPosProducts(cat, e.target.value.toLowerCase());
  });
  document.getElementById('btnGenerarOrden').addEventListener('click', openClienteModal);
  document.getElementById('btnGuardarPedido').addEventListener('click', handleGuardarPedido);
  document.getElementById('btnConfirmarCliente').addEventListener('click', handleConfirmarCliente);
  document.getElementById('cliMesa').addEventListener('input', e => {
    document.getElementById('cliMesaBadge').innerHTML = e.target.value === '0' ? '<span class="badge text-bg-info mt-1">Para Llevar</span>' : '';
  });
}

function renderPosProducts(cat, search = '') {
  document.getElementById('posProductGrid').innerHTML = buildProductGrid(cat, search);
}

function renderPosCart() {
  document.getElementById('posCartItems').innerHTML = buildCartView();
  document.getElementById('posCartTotal').textContent = `S/ ${getCartTotal().toFixed(2)}`;
  document.getElementById('btnGenerarOrden').disabled = !cart.length;
  document.getElementById('btnGuardarPedido').disabled = !cart.length;
}

// Alias para onclick del HTML
function quickAdd(id) { addToCart(id); renderPosCart(); }
function cartQty(i, d) { updateCartQty(i, d); renderPosCart(); }
function cartRemove(i) { removeCartItem(i); renderPosCart(); }

function openPersonalizar(id) {
  const prod = posProductos.find(p => p.id === id);
  if (!prod) return;
  document.getElementById('mpNombre').textContent = prod.nombre + ' — S/ ' + prod.precio.toFixed(2);
  document.getElementById('mpBody').innerHTML = buildPersonalizarBody(prod);
  const modal = new bootstrap.Modal(document.getElementById('modalPersonalizar'));
  modal.show();

  document.getElementById('mpQtyM').onclick = () => { const i = document.getElementById('mpQty'); if (+i.value > 1) i.value = +i.value - 1; };
  document.getElementById('mpQtyP').onclick = () => { const i = document.getElementById('mpQty'); i.value = +i.value + 1; };
  document.getElementById('mpAgregar').onclick = () => {
    const quitados = [], extras = [];
    document.querySelectorAll('#mpBody input[type=checkbox]').forEach(cb => {
      if (!cb.dataset.extra && !cb.checked) quitados.push(cb.value);
      if (cb.dataset.extra && cb.checked) extras.push(JSON.parse(cb.dataset.extra));
    });
    addCustomToCart(id, +document.getElementById('mpQty').value || 1, document.getElementById('mpNotas').value.trim(), quitados, extras);
    renderPosCart();
    modal.hide();
  };
}

function openClienteModal() {
  document.getElementById('formCliente').querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  ['cliNombre', 'cliMesa', 'cliTelefono'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('cliMesaBadge').innerHTML = '';
  document.querySelector('input[name=tipoPago][value=efectivo]').checked = true;
  document.getElementById('cliResumen').innerHTML = buildClienteResumen();
  document.getElementById('cliTotal').textContent = `S/ ${getCartTotal().toFixed(2)}`;
  new bootstrap.Modal(document.getElementById('modalCliente')).show();
}

function handleConfirmarCliente(e) {
  e.preventDefault();
  if (!validateForm('formCliente', {
    cliNombre: [V.required('Ingrese el nombre'), V.minLength(2), V.alphaSpaces()],
    cliMesa: [V.required('Ingrese número de mesa')]
  })) return;

  pendingOrder = {
    nombre: document.getElementById('cliNombre').value.trim(),
    mesa: +document.getElementById('cliMesa').value,
    telefono: document.getElementById('cliTelefono').value.trim(),
    tipoPago: document.querySelector('input[name=tipoPago]:checked').value
  };
  upsellItems = [];
  bootstrap.Modal.getInstance(document.getElementById('modalCliente')).hide();
  showUpsell();
}

function handleGuardarPedido() {
  if (saveOrderOnHold()) {
    renderPosCart();
    showToast('Pedido guardado en espera', 'info');
  }
}

function showUpsell() {
  document.getElementById('upsellGrid').innerHTML = buildUpsellGrid();
  document.getElementById('upsellAdded').innerHTML = '';
  new bootstrap.Modal(document.getElementById('modalUpsell')).show();
}

function addUpsell(n, p) {
  upsellItems.push({ nombre: n, precio: p, cantidad: 1 });
  document.getElementById('upsellAdded').innerHTML = '<h6 class="mt-2">Agregados:</h6>' +
    upsellItems.map(u => `<div class="d-flex justify-content-between small"><span>${u.nombre}</span><span>S/ ${u.precio.toFixed(2)}</span></div>`).join('');
}

function skipUpsell() {
  upsellItems = [];
  bootstrap.Modal.getInstance(document.getElementById('modalUpsell')).hide();
  finalizarPedido();
}

function confirmUpsell() {
  bootstrap.Modal.getInstance(document.getElementById('modalUpsell')).hide();
  finalizarPedido();
}

async function finalizarPedido() {
  const pedido = await createOrder(pendingOrder);
  document.getElementById('reciboContent').innerHTML = tplReceipt(pedido);
  new bootstrap.Modal(document.getElementById('modalRecibo')).show();
  renderPosCart();
}

function renderGuardados() {
  savedOrders = JSON.parse(localStorage.getItem('mt_saved_orders') || '[]');
  document.getElementById('moduleContent').innerHTML = buildGuardadosView();
}

function recuperarPedido(index) {
  if (recoverHeldOrder(index)) window.location.href = 'pos.html';
}

function eliminarGuardado(index) {
  if (!confirm('¿Eliminar pedido guardado?')) return;
  deleteHeldOrder(index);
  renderGuardados();
}

function printReceipt() { window.print(); }
function closeReceipt() { bootstrap.Modal.getInstance(document.getElementById('modalRecibo')).hide(); }
